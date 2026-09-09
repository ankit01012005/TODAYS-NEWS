import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/// Thin lifecycle wrapper around PrismaClient. Connects on module init and
/// disconnects on shutdown so the pool doesn't outlive the Nest app. No
/// query logic lives here — that belongs to the repositories/services of a
/// later phase.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Database connection established");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
