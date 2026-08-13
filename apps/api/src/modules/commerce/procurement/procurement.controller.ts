import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  adminPurchaseOrdersQuerySchema,
  adminSuppliersQuerySchema,
  createPurchaseOrderBodySchema,
  createSupplierBodySchema,
  updateSupplierBodySchema,
  type AdminPurchaseOrdersQuery,
  type AdminSuppliersQuery,
  type CreatePurchaseOrderBody,
  type CreateSupplierBody,
  type UpdateSupplierBody,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { ProcurementService } from './procurement.service';

@Controller('admin/commerce')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

  @Get('suppliers')
  listSuppliers(
    @Query(new ZodValidationPipe(adminSuppliersQuerySchema)) query: AdminSuppliersQuery,
  ) {
    return this.procurement.listSuppliers(query);
  }

  @Post('suppliers')
  createSupplier(
    @Body(new ZodValidationPipe(createSupplierBodySchema)) body: CreateSupplierBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.procurement.createSupplier(body, user.id, String(req.id ?? ''));
  }

  @Patch('suppliers/:id')
  updateSupplier(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSupplierBodySchema)) body: UpdateSupplierBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.procurement.updateSupplier(id, body, user.id, String(req.id ?? ''));
  }

  @Get('purchase-orders')
  listPurchaseOrders(
    @Query(new ZodValidationPipe(adminPurchaseOrdersQuerySchema))
    query: AdminPurchaseOrdersQuery,
  ) {
    return this.procurement.listPurchaseOrders(query);
  }

  @Post('purchase-orders')
  createPurchaseOrder(
    @Body(new ZodValidationPipe(createPurchaseOrderBodySchema)) body: CreatePurchaseOrderBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.procurement.createPurchaseOrder(body, user.id, String(req.id ?? ''));
  }

  @Get('purchase-orders/:id')
  getPurchaseOrder(@Param('id') id: string) {
    return this.procurement.getPurchaseOrder(id);
  }

  @Post('purchase-orders/:id/order')
  markOrdered(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.procurement.markOrdered(id, user.id, String(req.id ?? ''));
  }

  @Post('purchase-orders/:id/receive')
  receive(@Param('id') id: string, @CurrentUser() user: { id: string }, @Req() req: AuthedRequest) {
    return this.procurement.receive(id, user.id, String(req.id ?? ''));
  }

  @Post('purchase-orders/:id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: { id: string }, @Req() req: AuthedRequest) {
    return this.procurement.cancel(id, user.id, String(req.id ?? ''));
  }
}
