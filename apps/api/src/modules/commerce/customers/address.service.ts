import { Injectable, NotFoundException } from '@nestjs/common';
import type { AddressBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.customerAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, body: AddressBody) {
    if (body.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.customerAddress.create({
      data: {
        userId,
        label: body.label,
        fullName: body.fullName,
        phone: body.phone,
        line1: body.line1,
        line2: body.line2,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country ?? 'IN',
        isDefault: body.isDefault ?? false,
      },
    });
  }

  async update(userId: string, id: string, body: Partial<AddressBody>) {
    const existing = await this.prisma.customerAddress.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Address not found.' });
    }
    if (body.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.customerAddress.update({
      where: { id },
      data: {
        label: body.label,
        fullName: body.fullName,
        phone: body.phone,
        line1: body.line1,
        line2: body.line2,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        isDefault: body.isDefault,
      },
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.customerAddress.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Address not found.' });
    }
    await this.prisma.customerAddress.delete({ where: { id } });
    return { ok: true };
  }
}
