import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  adminSearchQuerySchema,
  adminCustomersQuerySchema,
  adminCouponsQuerySchema,
  adminReportsQuerySchema,
  adminAuditQuerySchema,
  createCouponBodySchema,
  couponActiveBodySchema,
  commercePolicyBodySchema,
  customerStatusBodySchema,
  customerCommunicationBodySchema,
  giftChromeBodySchema,
  googleTrackingBodySchema,
  type AdminAuditQuery,
  type AdminCouponsQuery,
  type AdminCustomersQuery,
  type AdminReportsQuery,
  type CommercePolicyBody,
  type CouponActiveBody,
  type CreateCouponBody,
  type CustomerCommunicationBody,
  type GiftChromeBody,
  type GoogleTracking,
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
import { TrackingTagsService } from './tracking-tags.service';

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
    private readonly tracking: TrackingTagsService,
  ) {}

  @Get('dashboard')
  getDashboard(@Query('range') range?: string) {
    const n = range ? Number(range) : 7;
    const days = n === 1 || n === 30 ? n : 7;
    return this.dashboard.dashboard(days);
  }

  @Get('reports/daily')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  dailyReport(@Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery) {
    return this.dashboard.dailyReport(query.days);
  }

  @Get('reports/sales')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  salesReport(@Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery) {
    return this.dashboard.salesReport(query.days);
  }

  @Get('reports/products')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  productsReport(@Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery) {
    return this.dashboard.productsReport(query.days);
  }

  @Get('reports/inventory')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  inventoryReport() {
    return this.dashboard.inventoryReport();
  }

  @Get('reports/returns')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  returnsReport(@Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery) {
    return this.dashboard.returnsReport(query.days);
  }

  @Get('reports/coupons')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  couponsReport(@Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery) {
    return this.dashboard.couponsReport(query.days);
  }

  @Get('reports/status')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  statusReport() {
    return this.dashboard.statusReport();
  }

  @Get('reports/funnel')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  funnelReport(@Query(new ZodValidationPipe(adminReportsQuerySchema)) query: AdminReportsQuery) {
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

  /** Soft Gift nav + default footer chrome (CMS-controllable). */
  @Get('gift-chrome')
  getGiftChrome() {
    return this.storefront.getGiftChrome();
  }

  @Post('gift-chrome')
  setGiftChrome(
    @Body(new ZodValidationPipe(giftChromeBodySchema)) body: GiftChromeBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.storefront.setGiftChrome(body, user.id, String(req.id ?? ''));
  }

  @Get('coupons')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'FINANCE')
  listCoupons(@Query(new ZodValidationPipe(adminCouponsQuerySchema)) query: AdminCouponsQuery) {
    return this.coupons.listAdmin(query);
  }

  @Post('coupons')
  @Roles('FINANCE', 'SUPER_ADMIN')
  createCoupon(
    @Body(new ZodValidationPipe(createCouponBodySchema)) body: CreateCouponBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.coupons.createAdmin(body, user.id, String(req.id ?? ''));
  }

  @Patch('coupons/:code')
  @Roles('FINANCE', 'SUPER_ADMIN')
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
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.customers.list(query, user.id, String(req.id ?? ''));
  }

  @Get('customers/:id')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'SUPPORT')
  getCustomer(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.customers.get(id, user.id, String(req.id ?? ''));
  }

  @Post('customers/:id/communications')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'SUPPORT')
  addCustomerCommunication(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(customerCommunicationBodySchema)) body: CustomerCommunicationBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.customers.addCommunication(id, body, user.id, String(req.id ?? ''));
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

  @Get('tracking')
  @Roles('SUPER_ADMIN')
  getTracking() {
    return this.tracking.getAdmin();
  }

  @Put('tracking')
  @Roles('SUPER_ADMIN')
  setTracking(
    @Body(new ZodValidationPipe(googleTrackingBodySchema)) body: GoogleTracking,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.tracking.set(body, user.id, String(req.id ?? ''));
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

@Controller('commerce/storefront/trust-cues')
export class TrustCuesPublicController {
  constructor(private readonly policy: CommercePolicyService) {}

  @Get()
  trustCues() {
    return this.policy.getTrustCues();
  }
}

@Controller('storefront/tracking')
export class StorefrontTrackingPublicController {
  constructor(private readonly tracking: TrackingTagsService) {}

  @Get()
  trackingPublic() {
    return this.tracking.getPublic();
  }
}
