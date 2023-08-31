import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { loggerOptions } from '@app/lengendary/config';
import { configuration } from '@app/lengendary/config/configuration';
import { PrismaModule } from '@app/lengendary/prisma';
import { CommonModule } from '@app/lengendary/common';
import { LoggerModule } from 'nestjs-pino';
import { TaskGeneratorModule } from './task-generatoor';
import { MessagingModule } from '@app/lengendary/messaging';

@Module({
    imports: [
        LoggerModule.forRoot(loggerOptions),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        MessagingModule,
        PrismaModule,
        ScheduleModule.forRoot(),
        CommonModule,
        TaskGeneratorModule,
    ],
})
export class AppModule {}
