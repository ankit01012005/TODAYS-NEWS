import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { AuthenticatedUser } from "../authenticated-user";
import { CAPABILITY_KEY } from "../decorators/require-capability.decorator";
import { Capability, roleHasCapability } from "../capabilities";

/// Runs after SessionAuthGuard. A route with no @RequireCapability only
/// needs to be signed in; one with it must additionally hold that
/// capability. This is the CAPABILITY check only (docs/23 §12.1) —
/// ownership and state legality are the service layer's job, not this
/// guard's, so a missing ownership check can never hide behind "the guard
/// already checked it".
@Injectable()
export class CapabilityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Capability | undefined>(CAPABILITY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user || !roleHasCapability(user.role, required)) {
      throw new ForbiddenException(`Missing required capability: ${required}`);
    }
    return true;
  }
}
