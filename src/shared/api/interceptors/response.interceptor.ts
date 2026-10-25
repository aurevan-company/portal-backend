import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import type { Request } from 'express';

import { API_MESSAGES } from '../response/api-messages.js';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    const langHeader = request.headers['accept-language'];
    const lang =
      typeof langHeader === 'string' &&
      langHeader.toLowerCase().startsWith('en')
        ? 'en'
        : 'mn';

    // return next.handle().pipe(
    //   map((data: unknown) => ({
    //     success: true,
    //     message: API_MESSAGES.SUCCESS[lang],
    //     data: data ?? null,
    //     meta: null,
    //   })),
    // );
    return next.handle().pipe(
      map((result: unknown) => {
        const message = API_MESSAGES.SUCCESS[lang];

        if (
          typeof result === 'object' &&
          result !== null &&
          'items' in result &&
          'meta' in result
        ) {
          const paginated = result as {
            items: unknown;
            meta: unknown;
          };

          return {
            success: true,
            message,
            data: paginated.items,
            meta: paginated.meta,
          };
        }

        return {
          success: true,
          message,
          data: result ?? null,
          meta: null,
        };
      }),
    );
  }
}
