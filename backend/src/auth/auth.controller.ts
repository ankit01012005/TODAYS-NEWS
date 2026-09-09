import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { Public } from "../common/decorators/public.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/authenticated-user";
import { AppEnv } from "../config/env.validation";

const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, a reset link has been sent.";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  /// SEC-09: rate limited well below the global default — sign-in is the
  /// single most attractive brute-force target in the product.
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("sign-in")
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ user: AuthenticatedUser }> {
    const { rawToken, user } = await this.auth.signIn(dto.email, dto.password);
    this.setSessionCookie(reply, rawToken);
    return { user };
  }

  // No @Public() — the global SessionAuthGuard must already have accepted
  // the cookie for there to be anything worth revoking.
  @Post("sign-out")
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const cookieName = this.config.get("SESSION_COOKIE_NAME", { infer: true });
    const rawToken = request.cookies?.[cookieName];
    if (rawToken) {
      await this.auth.signOut(rawToken);
    }
    reply.clearCookie(cookieName, { path: "/" });
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser): { user: AuthenticatedUser } {
    return { user };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("accept-invitation")
  @HttpCode(HttpStatus.NO_CONTENT)
  acceptInvitation(@Body() dto: SetPasswordDto): Promise<void> {
    return this.auth.setPasswordWithToken(dto.token, dto.password);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    // P2-11-style: identical response whether or not the account exists.
    await this.auth.requestPasswordReset(dto.email);
    return { message: GENERIC_RESET_MESSAGE };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("reset-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() dto: SetPasswordDto): Promise<void> {
    return this.auth.setPasswordWithToken(dto.token, dto.password);
  }

  private setSessionCookie(reply: FastifyReply, rawToken: string): void {
    const cookieName = this.config.get("SESSION_COOKIE_NAME", { infer: true });
    const ttlHours = this.config.get("SESSION_TTL_HOURS", { infer: true });
    const isProduction = this.config.get("NODE_ENV", { infer: true }) === "production";
    reply.setCookie(cookieName, rawToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: ttlHours * 60 * 60,
    });
  }
}
