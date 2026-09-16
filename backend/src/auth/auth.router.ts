import { Router, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import * as auth from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { validateBody } from "../common/middleware/validate-body.middleware";
import { CurrentUser } from "../common/current-user";
import { config } from "../config";

const GENERIC_RESET_MESSAGE = "If an account exists for that email, a reset link has been sent.";

/// SEC-09: sign-in and password-reset are the single most attractive
/// brute-force targets in the product. Every request reaches this API from
/// the Next.js server (docs/23 §11.4), so all staff share one client IP —
/// keying by IP alone would lock the whole newsroom out together after a
/// handful of attempts. Sign-in and forgot-password are therefore keyed by
/// IP + the account being targeted (what a brute force is actually
/// against); the token-spending routes, which carry no account, by IP.
const WINDOW_MS = 15 * 60_000;

function accountKey(req: Request): string {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return `${ipKeyGenerator(req.ip ?? "")}|${email}`;
}

const signInRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: accountKey,
  message: { statusCode: 429, message: "Too many sign-in attempts. Please wait a few minutes and try again." },
});

const resetRequestRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: accountKey,
  message: { statusCode: 429, message: "Too many reset requests. Please wait a few minutes and try again." },
});

const tokenRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { statusCode: 429, message: "Too many attempts. Please wait a few minutes and try again." },
});

function setSessionCookie(res: Response, rawToken: string): void {
  res.cookie(config.SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: config.SESSION_TTL_HOURS * 60 * 60 * 1000,
  });
}

/// Reachable without a session — mounted in app.ts BEFORE sessionAuth.
export const authPublicRouter = Router();

authPublicRouter.post(
  "/auth/sign-in",
  signInRateLimit,
  validateBody(SignInDto),
  async (req: Request<unknown, unknown, SignInDto>, res: Response) => {
    const { rawToken, user } = await auth.signIn(req.body.email, req.body.password);
    setSessionCookie(res, rawToken);
    res.status(200).json({ user });
  },
);

authPublicRouter.post(
  "/auth/accept-invitation",
  tokenRateLimit,
  validateBody(SetPasswordDto),
  async (req: Request<unknown, unknown, SetPasswordDto>, res: Response) => {
    await auth.setPasswordWithToken(req.body.token, req.body.password);
    res.status(204).end();
  },
);

authPublicRouter.post(
  "/auth/forgot-password",
  resetRequestRateLimit,
  validateBody(ForgotPasswordDto),
  async (req: Request<unknown, unknown, ForgotPasswordDto>, res: Response) => {
    // P2-11-style: identical response whether or not the account exists.
    await auth.requestPasswordReset(req.body.email);
    res.status(200).json({ message: GENERIC_RESET_MESSAGE });
  },
);

authPublicRouter.post(
  "/auth/reset-password",
  tokenRateLimit,
  validateBody(SetPasswordDto),
  async (req: Request<unknown, unknown, SetPasswordDto>, res: Response) => {
    await auth.setPasswordWithToken(req.body.token, req.body.password);
    res.status(204).end();
  },
);

/// Requires a session — mounted in app.ts AFTER sessionAuth.
export const authProtectedRouter = Router();

authProtectedRouter.post("/auth/sign-out", async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[config.SESSION_COOKIE_NAME];
  if (rawToken) {
    await auth.signOut(rawToken);
  }
  res.clearCookie(config.SESSION_COOKIE_NAME, { path: "/" });
  res.status(204).end();
});

authProtectedRouter.get("/auth/me", (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
});

authProtectedRouter.patch(
  "/auth/me",
  validateBody(UpdateProfileDto),
  async (req: Request<ParamsDictionary, unknown, UpdateProfileDto>, res: Response) => {
    const currentSession = req.cookies?.[config.SESSION_COOKIE_NAME] as string | undefined;
    const user = await auth.updateProfile(CurrentUser(req).id, req.body, currentSession);
    res.status(200).json({ user });
  },
);
