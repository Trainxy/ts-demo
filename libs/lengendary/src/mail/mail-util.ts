import { Injectable } from '@nestjs/common';
import { IPop3Config } from '../common/interface/email';
import * as _ from 'lodash';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Util } from '../common';

@Injectable()
export class MailUtil {
    constructor(
        @InjectPinoLogger(MailUtil.name)
        private readonly logger: PinoLogger,
        private util: Util,
        private configService: ConfigService,
    ) {}

    getMailPopConfig(user: string, password: string): IPop3Config {
        const provider = _.last(user.split('@')).replace('.', '_');
        const { host, port, tls } = this.configService.get(
            'email.' + provider + '.pop',
        );
        return {
            user,
            password,
            host,
            port,
            tls,
        };
    }
}
