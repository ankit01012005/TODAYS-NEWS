import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import fastifyCookie from "@fastify/cookie";
import { AppModule } from "./app.module";
import { AppEnv } from "./config/env.validation";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  await app.register(fastifyCookie);

  // SEC-06: reject anything a DTO doesn't declare, and coerce/validate the
  // rest — front-end validation is a courtesy, this is the rule.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // No frontend origin is decided yet (Phase 4C-1 scope) — permissive for
  // now, tightened once Next.js exists and talks to this API server-to-
  // server (docs/23 §11.4).
  app.enableCors({ origin: true, credentials: true });

  const config = app.get(ConfigService<AppEnv, true>);
  const port = config.get("PORT", { infer: true });
  await app.listen(port, "0.0.0.0");
}

bootstrap();
