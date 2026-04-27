import {
  CanActivate,
  ExecutionContext,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@batch-cooking/infrastructure';
import { ICustomRequest } from '../../shared/interfaces/request.interface';

@Injectable()
export class SupabaseJwtGuard implements CanActivate, OnModuleInit {
  private remoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const jwksUrl = this.configService.supabaseJwksUrl;
    if (jwksUrl) {
      this.remoteJwks = createRemoteJWKSet(new URL(jwksUrl));
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ICustomRequest>();
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) throw new UnauthorizedException('Bearer token required');

    try {
      const userId = this.remoteJwks
        ? await this.verifyWithJwks(token)
        : this.verifyWithSecret(token);

      req.user = { id: userId };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async verifyWithJwks(token: string): Promise<string> {
    const { payload } = await jwtVerify(token, this.remoteJwks!);
    const sub = (payload as JWTPayload).sub;
    if (!sub) throw new UnauthorizedException('Token missing sub claim');
    return sub;
  }

  private verifyWithSecret(token: string): string {
    const secret = this.configService.supabaseJwtSecret;
    if (!secret)
      throw new UnauthorizedException('No JWT verification method configured');
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    if (!payload.sub)
      throw new UnauthorizedException('Token missing sub claim');
    return payload.sub;
  }
}
