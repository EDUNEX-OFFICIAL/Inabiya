import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { MailMessage, MailPort } from './mail.port';

/**
 * Console/log email provider — no network, no SMTP.
 * Swap for a real adapter later without changing callers.
 */
@Injectable()
export class ConsoleMailAdapter implements MailPort {
  constructor(@InjectPinoLogger(ConsoleMailAdapter.name) private readonly logger: PinoLogger) {}

  async send(message: MailMessage): Promise<void> {
    this.logger.info(
      {
        to: message.to,
        subject: message.subject,
        template: message.template,
        textPreview: message.text.slice(0, 200),
        hasHtml: Boolean(message.html),
        meta: message.meta,
      },
      'mail.send (console stub — no network)',
    );
  }
}
