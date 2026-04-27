import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

interface PlatformConfig {
  supabase: {
    url: string;
    // Asymmetric (RS256) — new Supabase projects expose a JWKS endpoint
    jwksUrl?: string;
    // Symmetric (HS256) — legacy projects use a shared secret
    jwtSecret?: string;
  };
  gcp: { projectId: string; storageBucket: string };
  webOrigin: string;
}

@Injectable()
export class ConfigService {
  private readonly config: PlatformConfig;
  private readonly appEnv: string;

  constructor() {
    this.appEnv = process.env.APP_ENV || 'dev';

    if (this.appEnv === 'dev') {
      const configPath = path.join(
        process.cwd(),
        'config',
        `${this.appEnv}.json`,
      );
      this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } else {
      const raw = process.env.PLATFORM_CONFIG;
      if (!raw)
        throw new Error('PLATFORM_CONFIG is required in non-dev environments');
      this.config = JSON.parse(raw);
    }
  }

  get env(): string {
    return this.appEnv;
  }
  get supabaseUrl(): string {
    return this.config.supabase.url;
  }
  get supabaseJwksUrl(): string | undefined {
    return this.config.supabase.jwksUrl;
  }
  get supabaseJwtSecret(): string | undefined {
    return this.config.supabase.jwtSecret;
  }
  get gcpProjectId(): string {
    return this.config.gcp.projectId;
  }
  get gcpStorageBucket(): string {
    return this.config.gcp.storageBucket;
  }
  get webOrigin(): string {
    return this.config.webOrigin;
  }
}
