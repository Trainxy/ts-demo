import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Exchange } from '../common/enum/messaging';
import { MessagingService } from './messaging.service';

@Global()
@Module({
    imports: [
        RabbitMQModule.forRootAsync(RabbitMQModule, {
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                exchanges: [
                    {
                        name: Exchange.DEFAULT,
                        type: 'topic',
                    },
                ],
                uri: configService.get<string>('mq.uri'),
                connectionInitOptions: { wait: false },
                channels: {
                    'channel-1': {
                        prefetchCount: 1,
                        default: true,
                    },
                },
            }),
            inject: [ConfigService],
        }),
        MessagingModule,
    ],
    providers: [MessagingService],
    exports: [MessagingService],
})
export class MessagingModule {}
