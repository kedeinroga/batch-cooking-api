import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('libs', 'infrastructure', 'persistence', 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join('libs', 'infrastructure', 'persistence', 'prisma', 'migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
