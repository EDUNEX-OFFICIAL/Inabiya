import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  adminSearchQuerySchema,
  adminCustomersQuerySchema,
  adminReportsQuerySchema,
  adminAuditQuerySchema,
  createCouponBodySchema,
  couponActiveBodySchema,
  couponPreviewBodySchema,
  commercePolicyBodySchema,
  customerStatusBodySchema,
  giftChromeBodySchema,
  storefrontConfigBodySchema,
  type AdminAuditQuery,
  type AdminCustomersQuery,
  type AdminReportsQuery,
  type CommercePolicyBody,
  type CouponActiveBody,
  type CouponPreviewBody,
  type CreateCouponBody,
  type GiftChromeBody,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { AuditService } from '../../audit/audit.service';
import { CustomerAdminService } from '../customers/customer-admin.service';
import { CouponService } from '../promotions/coupon.service';
import { CartAbandonmentService } from '../cart/cart-abandonment.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CommercePolicyService } from './commerce-policy.service';
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
    private readonly policy: CommercePolicyService,
    private readonly audit: AuditService,
  ) {}

  @Get('dashboard')
  getDashboard(@Query('range') range?: string) {
    const n = range ? Number(range) : 7;
    const days = n === 1 || n === 30 ? n : 7;
    return this.dashboard.dashboard(days);
  }

  @Get('reports/daily')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  dailyReport(
    @Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery,
  ) {
    return this.dashboard.dailyReport(query.days);
  }

  @Get('reports/sales')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  salesReport(
    @Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery,
  ) {
    return this.dashboard.salesReport(query.days);
  }

  @Get('reports/products')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  productsReport(
    @Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery,
  ) {
    return this.dashboard.productsReport(query.days);
  }

  @Get('reports/inventory')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  inventoryReport() {
    return this.dashboard.inventoryReport();
  }

  @Get('reports/returns')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  returnsReport(
    @Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery,
  ) {
    return this.dashboard.returnsReport(query.days);
  }

  @Get('reports/coupons')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  couponsReport(
    @Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery,
  ) {
    return this.dashboard.couponsReport(query.days);
  }

  @Get('reports/status')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  statusReport() {
    return this.dashboard.statusReport();
  }

  @Get('reports/funnel')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  funnelReport(
    @Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery,
  ) {
    return this.analytics.funnelSummary(query.days);
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
    body: {
      featuredSlugs: string[];
      heroTitle?: string;
      heroSubtitle?: string;
    },
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

  @Post('coupons/preview')
  previewCoupon(
    @Body(new ZodValidationPipe(couponPreviewBodySchema)) body: CouponPreviewBody,
  ) {
    return this.coupons.preview(body);
  }

  @Post('coupons')
  createCoupon(
    @Body(new ZodValidationPipe(createCouponBodySchema)) body: CreateCouponBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.coupons.createAdmin(body, user.id, String(req.id ?? ''));
  }

  @Patch('coupons/:code')
  setCouponActive(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(couponActiveBodySchema)) body: CouponActiveBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.coupons.setActive(code, body.active, user.id, String(req.id ?? ''));
  }

  @Get('customers')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'SUPPORT')
  listCustomers(
    @Query(new ZodValidationPipe(adminCustomersQuerySchema)) query: AdminCustomersQuery,
  ) {
    return this.customers.list(query);
  }

  @Get('customers/:id')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'SUPPORT')
  getCustomer(@Param('id') id: string) {
    return this.customers.get(id);
  }

  @Patch('customers/:id/status')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
  setCustomerStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(customerStatusBodySchema)) body: { isActive: boolean },
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.customers.setActive(id, body.isActive, user.id, String(req.id ?? ''));
  }

  @Get('policy')
  getPolicy() {
    return this.policy.getPolicy();
  }

  @Post('policy')
  setPolicy(
    @Body(new ZodValidationPipe(commercePolicyBodySchema)) body: CommercePolicyBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.policy.setPolicy(body, user.id, String(req.id ?? ''));
  }

  @Get('audit')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
  listAudit(@Query(new ZodValidationPipe(adminAuditQuerySchema)) query: AdminAuditQuery) {
    return this.audit.list(query);
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
