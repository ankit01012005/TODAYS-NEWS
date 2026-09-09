import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AuthenticatedUser } from "../authenticated-user";

/// Reads the user SessionAuthGuard already attached to the request. Only
/// valid on routes behind that guard — there is nothing to fall back to.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new Error(
        "CurrentUser() used on a route with no SessionAuthGuard — nothing to read",
      );
    }
    return request.user;
  },
);
