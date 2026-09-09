import { Controller, Get } from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";

/// Liveness check for rolling deploys (docs/23 §20.1). Deliberately does
/// not touch the database — a DB hiccup shouldn't make the orchestrator
/// think the process itself is dead.
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  check(): { status: "ok" } {
    return { status: "ok" };
  }
}
