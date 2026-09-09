import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { FastifyRequest } from "fastify";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthenticatedUser } from "../authenticated-user";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AppEnv } from "../../config/env.validation";
import { hashToken } from "../token.util";

/// Applied globally (APP_GUARD) so every route denies by default (SEC-01);
/// @Public() is the only opt-out. Cookie -> session lookup -> user ->
/// request.user, per docs/23 §11.1's chain — capability/ownership checks
/// happen downstream, not here.
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedUser }>();

    const cookieName = this.config.get("SESSION_COOKIE_NAME", { infer: true });
    const rawToken = request.cookies?.[cookieName];
    if (!rawToken) {
      throw new UnauthorizedException("Sign-in required");
    }

    const tokenHash = hashToken(rawToken);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    const now = new Date();
    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt <= now ||
      session.user.status !== "ACTIVE"
    ) {
      throw new UnauthorizedException("Session is invalid or has expired");
    }

    request.user = {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      role: session.user.role,
    };
    return true;
  }
}
