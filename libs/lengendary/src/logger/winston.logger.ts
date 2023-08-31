import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';

export const winstonFormat = winston.format.printf(
    ({ level, message, timestamp }) => {
        return `${timestamp} ${
            process.pid
        } [${level.toUpperCase()}]: ${message}`;
    },
);

export class WinstonLogger implements LoggerService {
    protected logger: winston.Logger;

    protected init(winstonLogger: winston.Logger) {
        this.logger = winstonLogger;
    }

    public log(message: string, ...rest: any): any {
        return this.logger.info(message, ...rest);
    }

    public info(message: string, ...rest: any): any {
        return this.logger.info(message, ...rest);
    }

    public error(message: string, ...rest: any): any {
        return this.logger.error(message, ...rest);
    }

    public warn(message: string, ...rest: any): any {
        return this.logger.warn(message, ...rest);
    }

    public debug?(message: string, ...rest: any): any {
        return this.logger.debug(message, ...rest);
    }
}
