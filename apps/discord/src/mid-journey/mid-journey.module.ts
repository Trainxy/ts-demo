import { CosModule } from '@app/lengendary/cos';
import { LegendaryLoggerModule } from '@app/lengendary/logger';
import { MessagingModule } from '@app/lengendary/messaging';
import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImagineCommand } from './commands';
import { MidjourneyTaskController } from './controllers';
import { MidjourneyAccountController } from './controllers/account.controller';
import { DiscordApiService } from './discord-api.service';
import { DiscordConfigService } from './discord-config.service';
import { DiscordMessageParser } from './discord-message.parser';
import { MidJourneyGateWay } from './mid-journey.gateway';
import { MidJourneyService } from './mid-journey.service';

@Module({
    imports: [
        MessagingModule,
        DiscordModule.forRootAsync({
            useClass: DiscordConfigService,
        }),
        CosModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secretId: configService.get<string>('cos.midjourney.secretId'),
                secretKey: configService.get<string>(
                    'cos.midjourney.secretKey',
                ),
                bucket: configService.get<string>('cos.midjourney.bucket'),
                region: configService.get<string>('cos.midjourney.region'),
            }),
            inject: [ConfigService],
        }),
        LegendaryLoggerModule,
    ],
    controllers: [MidjourneyTaskController, MidjourneyAccountController],
    providers: [
        MidJourneyGateWay,
        ImagineCommand,
        MidJourneyService,
        DiscordApiService,
        DiscordMessageParser,
    ],
})
export class MidJourneyModule {}
