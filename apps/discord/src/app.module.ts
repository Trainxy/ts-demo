import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@app/lengendary/common';
import { configuration } from '@app/lengendary/config/configuration';
import { LoggerModule } from 'nestjs-pino';
import { loggerOptions } from '@app/lengendary/config';
import { MidJourneyModule } from './mid-journey/mid-journey.module';
import { PrismaModule } from '@app/lengendary/prisma';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        LoggerModule.forRoot(loggerOptions),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        ScheduleModule.forRoot(),
        CommonModule,
        PrismaModule,
        MidJourneyModule,
    ],
})
export class AppModule {}
