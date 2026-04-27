import 'dotenv/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GenericExceptionFilter } from './shared/filters/generic-exception.filter';
import { ConfigService } from '@batch-cooking/infrastructure';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.webOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new GenericExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  if (configService.env !== 'prod') {
    const config = new DocumentBuilder()
      .setTitle('Batch Cooking API')
      .setDescription('Backend para el servicio de Batch Cooking')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer('http://localhost:8080', 'Local')
      .build();

    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(process.env.PORT ?? 8080, '0.0.0.0');
  console.log(
    `[${configService.env}] Server on port ${process.env.PORT ?? 8080}`,
  );
}

bootstrap();
