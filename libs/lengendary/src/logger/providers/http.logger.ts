import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { join } from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';
import { winstonFormat, WinstonLogger } from '../winston.logger';

@Injectable()
export class HttpLogger extends WinstonLogger {
    constructor(private readonly configService: ConfigService) {
        super();
        super.init(
            winston.createLogger({
                levels: winston.config.syslog.levels,
                format: winston.format.combine(
                    winston.format.splat(),
                    winston.format.simple(),
                    winston.format.timestamp(),
                    winstonFormat,
                ),
                defaultMeta: { service: 'httpLogger' },
                transports: [
                    new winston.transports.Console({ level: 'debug' }),
                    new DailyRotateFile({
                        level: 'info',
                        filename: join(
                            this.configService.get('loggerDir'),
                            'http-logger-%DATE%.log',
                        ),
                        datePattern: 'YYYY-MM-DD',
                        zippedArchive: true,
                        maxSize: '100m',
                        maxFiles: '60d',
                    }),
                ],
            }),
        );
    }
}
