import { Global, MiddlewareConsumer, Module } from '@nestjs/common';
import { LegendaryLoggerModule } from '../logger';
import { FakeGenerator } from './fake-generator';
import { HttpLoggerMiddleware } from './middlewares';
import { Networking } from './networking';
import { Util } from './util';

@Global()
@Module({
    imports: [LegendaryLoggerModule],
    providers: [FakeGenerator, Util, Networking],
    exports: [FakeGenerator, Util, Networking],
})
export class CommonModule {
    public configure(consumer: MiddlewareConsumer): void {
        consumer.apply(HttpLoggerMiddleware).forRoutes('*');
    }
}
