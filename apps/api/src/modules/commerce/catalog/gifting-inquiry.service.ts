import { Injectable } from '@nestjs/common';
import type { GiftingInquiryBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class GiftingInquiryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: GiftingInquiryBody) {
    const row = await this.prisma.giftingInquiry.create({
      data: {
        type: body.type,
        fullName: body.fullName,
        email: body.email.toLowerCase().trim(),
        phone: body.phone,
        company: body.company,
        message: body.message,
        estimatedQty: body.estimatedQty,
        status: 'NEW',
      },
    });
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      createdAt: row.createdAt,
    };
  }

  async listAdmin() {
    const rows = await this.prisma.giftingInquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      company: r.company,
      message: r.message,
      estimatedQty: r.estimatedQty,
      status: r.status,
      createdAt: r.createdAt,
    }));
  }
}
