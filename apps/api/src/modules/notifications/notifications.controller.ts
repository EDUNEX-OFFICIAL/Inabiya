import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { testSendMailBodySchema } from '@inabiya/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../identity/current-user.decorator';
import { JwtAuthGuard, type AuthedRequest } from '../identity/jwt-auth.guard';
import { Roles } from '../identity/roles.decorator';
import { RolesGuard } from '../identity/roles.guard';
import { NotificationsService } from './notifications.service';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'COMMERCE_ADMIN')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('test-send')
  async testSend(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(testSendMailBodySchema))
    body: { to: string; subject: string; text: string },
    @Req() req: AuthedRequest,
  ) {
    return this.notifications.testSend({
      ...body,
      actorId: user.id,
      requestId: String(req.id ?? ''),
    });
  }
}
