import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { API_MESSAGES } from '../response/api-messages.js';

type Lang = 'mn' | 'en';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const header = request.headers['accept-language'];
    const lang: Lang =
      typeof header === 'string' && header.toLowerCase().startsWith('en')
        ? 'en'
        : 'mn';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string = API_MESSAGES.INTERNAL_ERROR[lang];
    let code = 'INTERNAL_SERVER_ERROR';
    let details: unknown = null;

    switch (status) {
      case 400:
        message = API_MESSAGES.BAD_REQUEST[lang];
        code = 'BAD_REQUEST';
        break;
      case 401:
        message = API_MESSAGES.UNAUTHORIZED[lang];
        code = 'UNAUTHORIZED';
        break;
      case 403:
        message = API_MESSAGES.FORBIDDEN[lang];
        code = 'FORBIDDEN';
        break;
      case 404:
        message = API_MESSAGES.NOT_FOUND[lang];
        code = 'NOT_FOUND';
        break;
      case 409:
        message = API_MESSAGES.CONFLICT[lang];
        code = 'CONFLICT';
        break;
      case 422:
        message = API_MESSAGES.VALIDATION_FAILED[lang];
        code = 'VALIDATION_FAILED';
        break;
      case 500:
        message = API_MESSAGES.INTERNAL_ERROR[lang];
        code = 'INTERNAL_SERVER_ERROR';
        break;
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null) {
        const exceptionBody = body as Record<string, unknown>;

        // class-validator-ийн алдаануудыг details-д оруулна.
        if (Array.isArray(exceptionBody.message)) {
          details = exceptionBody.message;
        }
      }
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
      error: {
        code,
        details,
      },
    });
  }
}
