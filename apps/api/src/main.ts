import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

  const extra = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const localDev =
    process.env.NODE_ENV === 'production'
      ? []
      : [
          'http://localhost:3001',
          'http://127.0.0.1:3001',
          'http://localhost:3101',
          'http://127.0.0.1:3101',
        ];
  const origins = [process.env.APP_URL, ...localDev, ...extra].filter(Boolean) as string[];
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  const port = Number(process.env.API_PORT ?? 4001);
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`API listening on http://localhost:${port}/api/v1`);
}

void bootstrap();
