import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');

  const port = Number(process.env.API_PORT ?? 4001);
  await app.listen(port);
  // bootstrap log via nest logger after listen
  const logger = app.get(Logger);
  logger.log(`API listening on http://localhost:${port}/api/v1`);
}

void bootstrap();
