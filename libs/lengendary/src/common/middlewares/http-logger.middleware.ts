import { HttpLogger } from '@app/lengendary/logger/providers';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
    constructor(private httpLogger: HttpLogger) {}

    public async use(req: Request, res: any, next: () => void): Promise<void> {
        if (req.body.operationName === 'IntrospectionQuery') {
            return next();
        }

        const _end = res.end;
        const _write = res.write;
        const chunks = [];

        res.write = (...restArgs: any) => {
            chunks.push(Buffer.from(restArgs[0]));
            _write.apply(res, restArgs);
        };

        res.end = (...restArgs: any) => {
            if (restArgs[0]) {
                chunks.push(Buffer.from(restArgs[0]));
            }
            const body = Buffer.concat(chunks).toString('utf8');
            this.httpLogger.info(
                '[REQUEST_HEADER]: %j, [REQUEST_BODY]: %j, [RESPONSE]: %j',
                req.headers,
                req.body,
                body,
            );
            _end.apply(res, restArgs);
        };
        next();
    }
}
