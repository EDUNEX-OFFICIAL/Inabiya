import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  adminInventoryQuerySchema,
  inventoryAdjustBodySchema,
  inventoryImportBodySchema,
  type AdminInventoryQuery,
  type InventoryAdjustBody,
  type InventoryImportBody,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AdminMutationRateLimitGuard } from '../../../common/guards/rate-limit.guard';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { InventoryService } from './inventory.service';

@Controller('admin/commerce/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
export class InventoryAdminController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  list(@Query(new ZodValidationPipe(adminInventoryQuerySchema)) query: AdminInventoryQuery) {
    const low =
      query.lowStock === '1' || query.lowStock === 'true'
        ? true
        : query.lowStock === '0' || query.lowStock === 'false'
          ? false
          : undefined;
    return this.inventory.listAdmin({
      q: query.q,
      lowStock: low,
      threshold: query.threshold,
    });
  }

  @Post('import')
  @UseGuards(AdminMutationRateLimitGuard)
  importCsv(
    @Body(new ZodValidationPipe(inventoryImportBodySchema)) body: InventoryImportBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.inventory.importBySku(
      { dryRun: body.dryRun, rows: body.rows },
      user.id,
      String(req.id ?? ''),
    );
  }

  @Get(':variantId/movements')
  movements(@Param('variantId') variantId: string) {
    return this.inventory.movements(variantId);
  }

  @Get(':variantId/reservations')
  reservations(@Param('variantId') variantId: string) {
    return this.inventory.listReservations(variantId);
  }

  @Post(':variantId/adjust')
  @UseGuards(AdminMutationRateLimitGuard)
  adjust(
    @Param('variantId') variantId: string,
    @Body(new ZodValidationPipe(inventoryAdjustBodySchema)) body: InventoryAdjustBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.inventory.adjustAdmin(variantId, body, user.id, String(req.id ?? ''));
  }
}
