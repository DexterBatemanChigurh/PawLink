import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { logger } from '../logger/winston-logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, originalUrl } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = ctx.getResponse<Response>();
          const ms = Date.now() - start;
          const msg = `${method} ${originalUrl} ${response.statusCode} ${ms}ms`;
          if (response.statusCode >= 400) {
            logger.warn(msg);
          } else {
            logger.info(msg);
          }
        },
        error: (err) => {
          const ms = Date.now() - start;
          logger.error(`${method} ${originalUrl} ERROR ${ms}ms`, {
            error: err.message || err,
          });
        },
      }),
    );
  }
}
