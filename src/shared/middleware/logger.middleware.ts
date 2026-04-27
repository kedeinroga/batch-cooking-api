import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { ICustomRequest } from '../interfaces/request.interface';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: ICustomRequest, res: Response, next: NextFunction): void {
    req.globalTraceId = randomUUID();
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      console.log(
        JSON.stringify({
          level: 'INFO',
          traceId: req.globalTraceId,
          method,
          url: originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
          time: new Date().toISOString(),
        }),
      );
    });

    next();
  }
}
