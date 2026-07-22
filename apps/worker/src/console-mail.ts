import type { Logger } from 'pino';

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  template?: string;
  meta?: Record<string, unknown>;
};

/** Console mail adapter — mirrors API ConsoleMailAdapter (no network). */
export async function sendConsoleMail(logger: Logger, message: MailMessage): Promise<void> {
  logger.info(
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
