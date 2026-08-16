import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, ReviewStatus } from '@prisma/client';
import type { AdminReviewsQuery, CreateReviewBody, ModerateReviewBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  adminReviewKeysetAfter,
  decodeAdminReviewCursor,
  encodeAdminReviewCursor,
} from './admin-reviews-cursor';

const VERIFIED_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listApprovedForSlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found.' });
    }
    const rows = await this.prisma.productReview.findMany({
      where: { productId: product.id, status: ReviewStatus.APPROVED },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { displayName: true } } },
    });
    const avg =
      rows.length === 0
        ? null
        : Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10;
    return {
      productId: product.id,
      averageRating: avg,
      count: rows.length,
      reviews: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        headline: r.headline,
        body: r.body,
        createdAt: r.createdAt,
        authorName: r.user.displayName ?? 'Customer',
        verifiedPurchase: Boolean(r.orderId),
      })),
    };
  }

  async createForSlug(slug: string, userId: string, body: CreateReviewBody, requestId?: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found.' });
    }

    const existing = await this.prisma.productReview.findUnique({
      where: { productId_userId: { productId: product.id, userId } },
    });
    if (existing) {
      throw new ConflictException({
        code: 'REVIEW_EXISTS',
        message: 'You already reviewed this product.',
      });
    }

    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        status: { in: VERIFIED_STATUSES },
        items: { some: { variant: { productId: product.id } } },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!order) {
      throw new BadRequestException({
        code: 'NOT_VERIFIED_PURCHASE',
        message: 'Only verified purchasers can review this product.',
      });
    }

    const review = await this.prisma.productReview.create({
      data: {
        productId: product.id,
        userId,
        orderId: order.id,
        rating: body.rating,
        headline: body.headline,
        body: body.body,
        status: ReviewStatus.PENDING,
      },
    });

    await this.audit.write({
      actorId: userId,
      action: 'review.submitted',
      resource: 'product_review',
      resourceId: review.id,
      metadata: { productId: product.id, rating: body.rating },
      requestId,
    });

    return {
      id: review.id,
      status: review.status,
      rating: review.rating,
      headline: review.headline,
      body: review.body,
      createdAt: review.createdAt,
    };
  }

  async listAdmin(query: AdminReviewsQuery = { limit: 25 }) {
    const limit = query.limit ?? 25;
    const andParts: Prisma.ProductReviewWhereInput[] = [];

    if (query.status) andParts.push({ status: query.status });

    if (query.q?.trim()) {
      const term = query.q.trim();
      andParts.push({
        OR: [
          { body: { contains: term, mode: 'insensitive' } },
          { headline: { contains: term, mode: 'insensitive' } },
          { product: { title: { contains: term, mode: 'insensitive' } } },
          { product: { slug: { contains: term, mode: 'insensitive' } } },
          { user: { email: { contains: term, mode: 'insensitive' } } },
          { user: { displayName: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }

    if (query.cursor) {
      try {
        andParts.push(
          adminReviewKeysetAfter(
            decodeAdminReviewCursor(query.cursor),
          ) as Prisma.ProductReviewWhereInput,
        );
      } catch {
        throw new BadRequestException({
          code: 'INVALID_CURSOR',
          message: 'Invalid pagination cursor.',
        });
      }
    }

    const rows = await this.prisma.productReview.findMany({
      where: andParts.length ? { AND: andParts } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: {
        product: { select: { slug: true, title: true } },
        user: { select: { email: true, displayName: true } },
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last ? encodeAdminReviewCursor({ createdAt: last.createdAt, id: last.id }) : null;

    const items = page.map((r) => ({
      id: r.id,
      rating: r.rating,
      headline: r.headline,
      body: r.body,
      status: r.status,
      moderationNote: r.moderationNote,
      createdAt: r.createdAt,
      product: r.product,
      customerEmail: r.user.email,
      customerName: r.user.displayName,
    }));

    return { items, nextCursor, limit };
  }

  async moderate(reviewId: string, body: ModerateReviewBody, actorId: string, requestId?: string) {
    const review = await this.prisma.productReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Review not found.' });
    }
    if (review.status !== ReviewStatus.PENDING && review.status !== body.status) {
      // allow re-moderate from PENDING mostly; also allow flip APPROVED↔REJECTED
    }
    const updated = await this.prisma.productReview.update({
      where: { id: reviewId },
      data: {
        status: body.status,
        moderationNote: body.moderationNote ?? null,
        moderatedAt: new Date(),
        moderatedById: actorId,
      },
    });
    await this.audit.write({
      actorId,
      action: `review.${body.status.toLowerCase()}`,
      resource: 'product_review',
      resourceId: reviewId,
      metadata: { from: review.status, note: body.moderationNote ?? null },
      requestId,
    });
    return updated;
  }
}
