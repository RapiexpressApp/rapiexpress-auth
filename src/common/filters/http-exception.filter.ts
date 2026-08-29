import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiErrorResponse,
  NestHttpExceptionShape,
  ResolvedError,
} from './interfaces/http-exception.filter.interfaces.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const resolved = this.resolveError(exception);

    if (!(exception instanceof HttpException)) {
      console.error('Excepción no controlada:', exception);
    }

    const body: ApiErrorResponse = {
      ...resolved,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(resolved.statusCode).json(body);
  }

  resolveError(exception: unknown): ResolvedError {
    if (exception instanceof HttpException) return this.resolveHttpException(exception);

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: ['Error interno del servidor'],
      error: 'Internal Server Error',
    };
  }

  resolveHttpException(exception: HttpException): ResolvedError {
    const statusCode = exception.getStatus();
    const body = exception.getResponse();

    if (this.isNestHttpExceptionShape(body)) {
      return {
        statusCode,
        message: Array.isArray(body.message) ? body.message : [body.message],
        error: body.error,
      };
    }

    if (typeof body === 'string') return { statusCode, message: [body] };

    return { statusCode, message: ['Error inesperado'] };
  }

  isNestHttpExceptionShape(body: unknown): body is NestHttpExceptionShape {
    return typeof body === 'object' && body !== null && 'statusCode' in body && 'message' in body;
  }
}
