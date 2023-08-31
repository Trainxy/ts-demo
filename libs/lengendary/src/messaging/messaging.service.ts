import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class MessagingService {
    constructor(private readonly amqpConnection: AmqpConnection) {}
    async send(exchange, routingKey, message) {
        return this.amqpConnection.publish(exchange, routingKey, message);
    }
}
