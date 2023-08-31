import { Injectable } from '@nestjs/common';
import { Util } from './util';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as _ from 'lodash';
import { ConfigService } from '@nestjs/config';
import { IProxy } from './interface/networking';
import { ProxyProtocol, ProxyResource } from './enum/networking';

@Injectable()
export class Networking {
    constructor(
        private util: Util,
        @InjectPinoLogger(Networking.name)
        private readonly logger: PinoLogger,
        private readonly configService: ConfigService,
    ) {}

    async getNewProxy(
        resourceType: ProxyResource,
        params: any,
    ): Promise<{ proxy: IProxy; params?: any }> {
        switch (resourceType) {
            case ProxyResource.FENGYUN: {
                return this.fengyun();
            }
            case ProxyResource.SMARTPROXY: {
                return this.smartproxy(params);
            }
        }
    }

    async smartproxy({
        countryCode,
    }: {
        countryCode: string;
    }): Promise<{ proxy: IProxy; params?: any }> {
        const proxyConfig = this.configService.get(
            'networking.proxy.' + ProxyResource.SMARTPROXY,
        );
        const port = _.random(8080, 9090);
        const session = this.util.randomStr(8);
        const proxy: IProxy = {
            host: '127.0.0.1',
            port: port,
            protocol: ProxyProtocol.SOCKS5,
        };
        const pproxyCommand = `pproxy -l socks5://:${port} -r socks5://${proxyConfig.host}:${proxyConfig.port}#${proxyConfig.user}_area-${countryCode}_life-20_session-${session}:${proxyConfig.password}`;
        this.logger.info('执行 smartproxy 代理转发: ' + pproxyCommand);
        const pproxyProcess = this.util.execTerminalCommandSync(pproxyCommand);

        return {
            proxy,
            params: {
                pproxyProcess,
            },
        };
    }

    async fengyun(): Promise<{ proxy: IProxy; params?: any }> {
        this.logger.info('执行代理 IP 重新拨号脚本');
        let result: string;
        for (let ii = 1; ii < 5; ii++) {
            this.logger.info('第' + ii + '次获取');
            try {
                result = await this.util.execTerminalCommand(
                    this.configService.get(
                        'networking.proxyVps.fengyun.command',
                    ),
                );
                if (result) {
                    break;
                }
            } catch (e) {
                console.log('er:' + e);
            }
        }
        this.logger.info('脚本执行结果：' + result);
        const ip = _.trim(_.last(_.first(result.split('\n')).split(':')));
        this.logger.info('分析出 IP：' + ip);
        const proxy = {
            host: ip,
            port: this.configService.get('networking.proxy.fengyun.port'),
            protocol: ProxyProtocol.SOCKS5,
        };
        return {
            proxy,
        };
    }

    proxyAddress(proxy: IProxy) {
        return proxy.protocol + '://' + proxy.host + ':' + proxy.port;
    }
}
