import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '@batch-cooking/domain';
import { DOMAIN_EXCEPTIONS_HTTP_MAP } from '../constants/domain-exceptions-http.map';

@Catch()
export class GenericExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let statusCode = 500;
    let code = 'internal-error';
    let errorMessage = 'Internal server error';

    if (exception instanceof DomainException) {
      const mapping = DOMAIN_EXCEPTIONS_HTTP_MAP[exception.instanceCode];
      if (mapping) ({ statusCode, code, errorMessage } = mapping);
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      errorMessage =
        typeof body === 'string'
          ? body
          : ((body as any).message ?? exception.message);
      code = `http-${statusCode}`;
    }

    console.error(
      JSON.stringify({
        level: 'ERROR',
        statusCode,
        code,
        method: req.method,
        url: req.url,
        error:
          exception instanceof Error ? exception.message : String(exception),
        time: new Date().toISOString(),
      }),
    );

    res.status(statusCode).json({
      statusCode,
      code,
      errorMessage,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
