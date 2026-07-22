import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  adminSearchQuerySchema,
  createCouponBodySchema,
  customerStatusBodySchema,
  giftChromeBodySchema,
  storefrontConfigBodySchema,
  type GiftChromeBody,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { CustomerAdminService } from '../customers/customer-admin.service';
import { CouponService } from '../promotions/coupon.service';
import { CartAbandonmentService } from '../cart/cart-abandonment.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { OpsDashboardService } from './ops-dashboard.service';
import { StorefrontConfigService } from './storefront-config.service';

@Controller('admin/commerce')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
export class OpsAdminController {
  constructor(
    private readonly dashboard: OpsDashboardService,
    private readonly storefront: StorefrontConfigService,
    private readonly coupons: CouponService,
    private readonly customers: CustomerAdminService,
    private readonly abandonment: CartAbandonmentService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.dashboard.dashboard();
  }

  @Get('reports/daily')
  dailyReport(@Query('days') days?: string) {
    const n = days ? Number(days) : 7;
    return this.dashboard.dailyReport(
      Number.isFinite(n) ? Math.min(90, Math.max(1, Math.floor(n))) : 7,
    );
  }

  @Get('reports/status')
  statusReport() {
    return this.dashboard.statusReport();
  }

  @Get('reports/funnel')
  funnelReport(@Query('days') days?: string) {
    const n = days ? Number(days) : 7;
    return this.analytics.funnelSummary(
      Number.isFinite(n) ? Math.min(90, Math.max(1, Math.floor(n))) : 7,
    );
  }

  @Post('carts/abandonment-scan')
  abandonmentScan(@Query('idleMinutes') idleMinutes?: string) {
    const n = idleMinutes ? Number(idleMinutes) : 60;
    return this.abandonment.scanAndEnqueue(
      Number.isFinite(n) ? Math.min(24 * 60, Math.max(5, Math.floor(n))) : 60,
    );
  }

  @Get('search')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'SUPPORT')
  search(@Query(new ZodValidationPipe(adminSearchQuerySchema)) query: { q: string }) {
    return this.dashboard.search(query.q);
  }

  @Get('storefront')
  getStorefront() {
    return this.storefront.getHomeConfig();
  }

  @Post('storefront')
  setStorefront(
    @Body(new ZodValidationPipe(storefrontConfigBodySchema))
    body: { featuredSlugs: string[]; heroTitle?: string; heroSubtitle?: string },
  ) {
    return this.storefront.setHomeConfig(body);
  }

  /** Soft Gift nav + default footer chrome (CMS-controllable). */
  @Get('gift-chrome')
  getGiftChrome() {
    return this.storefront.getGiftChrome();
  }

  @Post('gift-chrome')
  setGiftChrome(@Body(new ZodValidationPipe(giftChromeBodySchema)) body: GiftChromeBody) {
    return this.storefront.setGiftChrome(body);
  }

  @Get('coupons')
  listCoupons() {
    return this.coupons.listAdmin();
  }

  @Post('coupons')
  createCoupon(@Body(new ZodValidationPipe(createCouponBodySchema)) body: Parameters<CouponService['createAdmin']>[0]) {
    return this.coupons.createAdmin(body);
  }

  @Patch('coupons/:code')
  setCouponActive(
    @Param('code') code: string,
    @Body() body: { active: boolean },
  ) {
    return this.coupons.setActive(code, Boolean(body.active));
  }

  @Get('customers')
  listCustomers() {
    return this.customers.list();
  }

  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    return this.customers.get(id);
  }

  @Patch('customers/:id/status')
  setCustomerStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(customerStatusBodySchema)) body: { isActive: boolean },
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.customers.setActive(id, body.isActive, user.id, String(req.id ?? ''));
  }
}

@Controller('catalog/home')
export class StorefrontPublicController {
  constructor(private readonly storefront: StorefrontConfigService) {}

  @Get()
  homeConfig() {
    return this.storefront.getHomeConfig();
  }
}

@Controller('catalog/gift-chrome')
export class GiftChromePublicController {
  constructor(private readonly storefront: StorefrontConfigService) {}

  @Get()
  giftChrome() {
    return this.storefront.getGiftChrome();
  }
}
