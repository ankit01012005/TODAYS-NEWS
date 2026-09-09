import { Router, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import * as auth from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { validateBody } from "../common/middleware/validate-body.middleware";
import { config } from "../config";

const GENERIC_RESET_MESSAGE = "If an account exists for that email, a reset link has been sent.";

/// SEC-09: rate limited well below the API's general default — sign-in and
/// password-reset are the single most attractive brute-force targets in the
/// product.
const authRateLimit = rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: true });

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
  authRateLimit,
  validateBody(SignInDto),
  async (req: Request<unknown, unknown, SignInDto>, res: Response) => {
    const { rawToken, user } = await auth.signIn(req.body.email, req.body.password);
    setSessionCookie(res, rawToken);
    res.status(200).json({ user });
  },
);

authPublicRouter.post(
  "/auth/accept-invitation",
  authRateLimit,
  validateBody(SetPasswordDto),
  async (req: Request<unknown, unknown, SetPasswordDto>, res: Response) => {
    await auth.setPasswordWithToken(req.body.token, req.body.password);
    res.status(204).end();
  },
);

authPublicRouter.post(
  "/auth/forgot-password",
  authRateLimit,
  validateBody(ForgotPasswordDto),
  async (req: Request<unknown, unknown, ForgotPasswordDto>, res: Response) => {
    // P2-11-style: identical response whether or not the account exists.
    await auth.requestPasswordReset(req.body.email);
    res.status(200).json({ message: GENERIC_RESET_MESSAGE });
  },
);

authPublicRouter.post(
  "/auth/reset-password",
  authRateLimit,
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
