import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

const RETURN_WINDOW_KEY = 'policy.return_window_days';
export const DEFAULT_RETURN_WINDOW_DAYS = 14;

export type ReturnPolicy = {
  windowDays: number;
};

@Injectable()
export class CommercePolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async getReturnPolicy(): Promise<ReturnPolicy> {
    const row = await this.prisma.commerceSetting.findUnique({
      where: { key: RETURN_WINDOW_KEY },
    });
    const raw = row?.value;
    const days =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string'
          ? Number(raw)
          : DEFAULT_RETURN_WINDOW_DAYS;
    return {
      windowDays:
        Number.isFinite(days) && days >= 1 ? Math.floor(days) : DEFAULT_RETURN_WINDOW_DAYS,
    };
  }

  async setReturnPolicy(input: { windowDays: number }): Promise<ReturnPolicy> {
    const windowDays = Math.floor(input.windowDays);
    if (!Number.isFinite(windowDays) || windowDays < 1 || windowDays > 365) {
      throw new BadRequestException({
        code: 'INVALID_RETURN_WINDOW',
        message: 'Return window must be between 1 and 365 days.',
      });
    }
    await this.prisma.commerceSetting.upsert({
      where: { key: RETURN_WINDOW_KEY },
      create: { key: RETURN_WINDOW_KEY, value: windowDays },
      update: { value: windowDays },
    });
    return { windowDays };
  }
}
