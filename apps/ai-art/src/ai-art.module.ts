import { Module } from '@nestjs/common';
import { AiArtController } from './ai-art.controller';
import { AiArtService } from './ai-art.service';
import { LegendaryLoggerModule } from '@app/lengendary/logger';
import { configuration, loggerOptions } from '@app/lengendary/config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CosModule } from '@app/lengendary/cos';
import { MessagingModule } from '@app/lengendary/messaging';
import { RedisModule } from '@app/lengendary/redis';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from '@app/lengendary/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
    imports: [
        LoggerModule.forRoot(loggerOptions),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        CosModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secretId: configService.get<string>('cos.aiArt.secretId'),
                secretKey: configService.get<string>('cos.aiArt.secretKey'),
                bucket: configService.get<string>('cos.aiArt.bucket'),
                region: configService.get<string>('cos.aiArt.region'),
                useAccelerate: configService.get<boolean>(
                    'cos.aiArt.useAccelerate',
                ),
            }),
            inject: [ConfigService],
        }),
        ScheduleModule.forRoot(),
        LegendaryLoggerModule,
        CommonModule,
        MessagingModule,
        RedisModule,
    ],
    controllers: [AiArtController],
    providers: [AiArtService],
})
export class AiArtModule {}
