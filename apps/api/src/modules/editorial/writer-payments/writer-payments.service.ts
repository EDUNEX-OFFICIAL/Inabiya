import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, WriterPaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class WriterPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(status?: WriterPaymentStatus) {
    return this.prisma.writerPayment.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        writer: { select: { id: true, email: true, displayName: true } },
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            publishedAt: true,
          },
        },
      },
    });
  }

  async release(paymentId: string, actorId: string, requestId?: string) {
    const payment = await this.prisma.writerPayment.findUnique({
      where: { id: paymentId },
      include: { article: true },
    });
    if (!payment) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Payment not found.' });
    }
    if (payment.status !== WriterPaymentStatus.PENDING) {
      throw new BadRequestException({
        code: 'NOT_PENDING',
        message: `Payment is ${payment.status}, not PENDING.`,
      });
    }
    if (payment.article.status !== ArticleStatus.PUBLISHED) {
      throw new BadRequestException({
        code: 'ARTICLE_NOT_PUBLISHED',
        message: 'Writer payment can only be released after publish.',
      });
    }
    const updated = await this.prisma.writerPayment.update({
      where: { id: paymentId },
      data: {
        status: WriterPaymentStatus.RELEASED,
        releasedAt: new Date(),
        releasedById: actorId,
      },
      include: {
        writer: { select: { id: true, email: true, displayName: true } },
        article: { select: { id: true, title: true, slug: true } },
      },
    });
    await this.audit.write({
      actorId,
      action: 'writer_payment.released',
      resource: 'writer_payment',
      resourceId: paymentId,
      metadata: { amountPaise: payment.amountPaise, articleId: payment.articleId },
      requestId,
    });
    return updated;
  }
}
