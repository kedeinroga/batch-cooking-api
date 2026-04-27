import { Request } from 'express';
import { UserRole } from '@batch-cooking/domain';

export interface ICustomRequest extends Request {
  globalTraceId: string;
  user: { id: string; role?: UserRole };
}
