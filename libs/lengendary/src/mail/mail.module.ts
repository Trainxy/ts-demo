import { Global, Module } from '@nestjs/common';
import { MailUtil } from './mail-util';
import { Pop3 } from './pop3';

@Global()
@Module({
    providers: [MailUtil, Pop3],
    exports: [MailUtil, Pop3],
})
export class MailModule {}
