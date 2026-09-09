import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";

/// Maps every error to the vocabulary in docs/12 §0: a plain message, never
/// a stack trace or a raw database error (SEC-06). Fastify's own
/// `request.id` is the correlation ID (docs/23 §8.4) — logged here and
/// returned in the body so a user can quote it when reporting a problem.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      reply.status(status).send({
        statusCode: status,
        correlationId: request.id,
        ...(typeof body === "string" ? { message: body } : body),
      });
      return;
    }

    // Anything else is unexpected — log the real error for us, tell the
    // caller nothing beyond "something broke" (docs/12 §0: Error state).
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url} [${request.id}]`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      correlationId: request.id,
      message: "Something went wrong on our side. Please try again.",
    });
  }
}
