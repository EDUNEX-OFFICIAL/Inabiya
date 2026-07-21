import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { HealthModule } from './modules/platform/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { SearchModule } from './modules/search/search.module';
import { CommerceModule } from './modules/commerce/commerce.module';
import { EditorialModule } from './modules/editorial/editorial.module';
import { CreatorModule } from './modules/creator/creator.module';
import { PlatformModule } from './modules/platform/platform.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { PaymentsModule } from './infrastructure/payments/payments.module';
import { NotificationsQueueModule } from './infrastructure/notifications/notifications-queue.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { CommonModule } from './common/common.module';
import { SecurityHeadersModule } from './common/security-headers.middleware';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId: (req, res) => {
          const existing = req.headers['x-request-id'];
          const id = typeof existing === 'string' && existing.length > 0 ? existing : randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'password',
            'passwordHash',
            'token',
            'refreshToken',
          ],
          remove: true,
        },
      },
    }),
    CommonModule,
    SecurityHeadersModule,
    PrismaModule,
    RedisModule,
    StorageModule,
    PaymentsModule,
    NotificationsQueueModule,
    MailModule,
    HealthModule,
    IdentityModule,
    MediaModule,
    NotificationsModule,
    AuditModule,
    SearchModule,
    CommerceModule,
    EditorialModule,
    CreatorModule,
    PlatformModule,
  ],
})
export class AppModule {}
