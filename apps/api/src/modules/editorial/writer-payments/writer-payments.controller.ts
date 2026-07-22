import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { WriterPaymentStatus } from '@prisma/client';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { WriterPaymentsService } from './writer-payments.service';

@Controller('editorial/writer-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('FINANCE', 'CONTENT_ADMIN', 'SUPER_ADMIN')
export class WriterPaymentsController {
  constructor(private readonly payments: WriterPaymentsService) {}

  @Get()
  list(@Query('status') status?: string) {
    const allowed = Object.values(WriterPaymentStatus) as string[];
    const parsed = status && allowed.includes(status) ? (status as WriterPaymentStatus) : undefined;
    return this.payments.list(parsed);
  }

  @Post(':id/release')
  @Roles('FINANCE', 'SUPER_ADMIN')
  release(@CurrentUser() user: { id: string }, @Param('id') id: string, @Req() req: AuthedRequest) {
    return this.payments.release(id, user.id, String(req.id ?? ''));
  }
}
