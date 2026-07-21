import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

const FEATURED_KEY = 'homepage.featured_slugs';
const HERO_TITLE_KEY = 'homepage.hero_title';
const HERO_SUBTITLE_KEY = 'homepage.hero_subtitle';

export type StorefrontHomeConfig = {
  featuredSlugs: string[];
  heroTitle: string;
  heroSubtitle: string;
};

@Injectable()
export class StorefrontConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeConfig(): Promise<StorefrontHomeConfig> {
    const rows = await this.prisma.commerceSetting.findMany({
      where: {
        key: { in: [FEATURED_KEY, HERO_TITLE_KEY, HERO_SUBTITLE_KEY] },
      },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const slugs = map.get(FEATURED_KEY);
    return {
      featuredSlugs: Array.isArray(slugs) ? (slugs as string[]) : [],
      heroTitle: (map.get(HERO_TITLE_KEY) as string) ?? 'Gift',
      heroSubtitle:
        (map.get(HERO_SUBTITLE_KEY) as string) ??
        'Soft Gift storefront — browse curated baby gifts and build your box.',
    };
  }

  async setHomeConfig(input: {
    featuredSlugs: string[];
    heroTitle?: string;
    heroSubtitle?: string;
  }): Promise<StorefrontHomeConfig> {
    await this.prisma.commerceSetting.upsert({
      where: { key: FEATURED_KEY },
      create: { key: FEATURED_KEY, value: input.featuredSlugs },
      update: { value: input.featuredSlugs },
    });
    if (input.heroTitle != null) {
      await this.prisma.commerceSetting.upsert({
        where: { key: HERO_TITLE_KEY },
        create: { key: HERO_TITLE_KEY, value: input.heroTitle },
        update: { value: input.heroTitle },
      });
    }
    if (input.heroSubtitle != null) {
      await this.prisma.commerceSetting.upsert({
        where: { key: HERO_SUBTITLE_KEY },
        create: { key: HERO_SUBTITLE_KEY, value: input.heroSubtitle },
        update: { value: input.heroSubtitle },
      });
    }
    return this.getHomeConfig();
  }
}
