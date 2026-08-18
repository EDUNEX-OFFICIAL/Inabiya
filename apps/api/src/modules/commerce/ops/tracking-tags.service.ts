import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  googleTrackingAdminForm,
  normalizeGoogleTracking,
  type GoogleTracking,
} from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

export const TRACKING_GOOGLE_KEY = 'tracking.google';

@Injectable()
export class TrackingTagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getPublic(): Promise<GoogleTracking> {
    const row = await this.prisma.commerceSetting.findUnique({
      where: { key: TRACKING_GOOGLE_KEY },
    });
    return normalizeGoogleTracking(row?.value ?? {});
  }

  async getAdmin(): Promise<Required<GoogleTracking>> {
    return googleTrackingAdminForm(await this.getPublic());
  }

  async set(
    input: GoogleTracking,
    actorId: string,
    requestId?: string,
  ): Promise<Required<GoogleTracking>> {
    const before = await this.getPublic();
    const next = normalizeGoogleTracking(input);
    await this.prisma.commerceSetting.upsert({
      where: { key: TRACKING_GOOGLE_KEY },
      create: {
        key: TRACKING_GOOGLE_KEY,
        value: next as Prisma.InputJsonValue,
      },
      update: { value: next as Prisma.InputJsonValue },
    });
    await this.audit.write({
      actorId,
      action: 'tracking.google.updated',
      resource: 'commerce_setting',
      resourceId: TRACKING_GOOGLE_KEY,
      metadata: { before, after: next },
      requestId,
    });
    return this.getAdmin();
  }
}
