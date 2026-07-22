import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { MAIL_PORT, type MailPort } from '../../infrastructure/mail/mail.port';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(MAIL_PORT) private readonly mail: MailPort,
    private readonly audit: AuditService,
  ) {}

  async testSend(input: {
    to: string;
    subject: string;
    text: string;
    actorId: string;
    requestId?: string;
  }): Promise<{ ok: true }> {
    await this.mail.send({
      to: input.to,
      subject: input.subject,
      text: input.text,
      template: 'admin.test_send',
      meta: { actorId: input.actorId },
    });
    await this.audit.write({
      actorId: input.actorId,
      action: 'notification.test_send',
      resource: 'mail',
      metadata: { to: input.to, subject: input.subject },
      requestId: input.requestId,
    });
    return { ok: true };
  }
}
