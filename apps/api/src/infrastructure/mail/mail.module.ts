import { Global, Module } from '@nestjs/common';
import { ConsoleMailAdapter } from './console-mail.adapter';
import { MAIL_PORT } from './mail.port';

@Global()
@Module({
  providers: [
    ConsoleMailAdapter,
    {
      provide: MAIL_PORT,
      useExisting: ConsoleMailAdapter,
    },
  ],
  exports: [MAIL_PORT, ConsoleMailAdapter],
})
export class MailModule {}
