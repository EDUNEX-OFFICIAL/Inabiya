import { Body, Controller, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { OrderStatus } from '@prisma/client';
import { adminOrderStatusSchema, orderNoteBodySchema } from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('me')
  myOrders(@CurrentUser() user: { id: string }) {
    return this.orders.listForCustomer(user.id);
  }

  @Get('me/:id/invoice/pdf')
  async myInvoicePdf(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { filename, pdf } = await this.orders.getInvoicePdfForCustomer(user.id, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(pdf);
  }

  @Get('me/:id/invoice')
  myInvoice(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.orders.getInvoiceForCustomer(user.id, id);
  }

  @Get('me/:id')
  myOrder(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.orders.getForCustomer(user.id, id);
  }
}

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
export class OrdersAdminController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list() {
    return this.orders.listAdmin();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.getAdmin(id);
  }

  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(orderNoteBodySchema)) body: { body: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.orders.addNote(id, body.body, user.id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: { id: string }, @Req() req: AuthedRequest) {
    return this.orders.cancelAndRefundAdmin(id, user.id, String(req.id ?? ''));
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminOrderStatusSchema)) body: { status: OrderStatus },
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.orders.updateStatusAdmin(id, body.status, user.id, String(req.id ?? ''));
  }
}
