import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '../logger/winston-logger';

function requestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const rid = requestId();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let detail: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        const body = res as Record<string, any>;
        message = Array.isArray(body.message) ? body.message[0] : body.message || message;
        detail = body.error;
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      detail = exception.name;
    }

    if (status >= 500) {
      logger.error(`[${rid}] ${request.method} ${request.originalUrl} ${status} - ${message}`, {
        stack: exception instanceof Error ? exception.stack : undefined,
        requestId: rid,
      });
    } else if (status >= 400) {
      logger.warn(`[${rid}] ${request.method} ${request.originalUrl} ${status} - ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(detail && { error: detail }),
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      requestId: rid,
    });
  }
}
