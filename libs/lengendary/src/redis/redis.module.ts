import { Global, Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            extraProviders: [],
            useFactory: async (configService: ConfigService): Promise<any> => ({
                store: redisStore,
                ...configService.get<any>('redis', {}),
            }),
            inject: [ConfigService],
        }),
    ],
})
export class RedisModule {}
