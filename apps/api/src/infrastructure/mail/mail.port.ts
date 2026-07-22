export const MAIL_PORT = Symbol('MAIL_PORT');

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  template?: string;
  meta?: Record<string, unknown>;
};

export interface MailPort {
  send(message: MailMessage): Promise<void>;
}
