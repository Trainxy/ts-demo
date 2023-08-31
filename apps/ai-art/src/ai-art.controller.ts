import { Body, Controller, Post } from '@nestjs/common';
import { AiArtService } from './ai-art.service';
import { ImagineTaskDto } from './dto';
import { Exchange, RoutingKey } from '@app/lengendary/common/enum/messaging';
import { MessagingService } from '@app/lengendary/messaging';

@Controller('sd/imagine')
export class AiArtController {
    constructor(
        private readonly messagingService: MessagingService,
        private readonly aiArtService: AiArtService,
    ) {}

    @Post('txt2img')
    async txt2img(@Body() imagineTask: ImagineTaskDto): Promise<string> {
        await this.messagingService.send(
            Exchange.DEFAULT,
            RoutingKey.NEW_AI_ART_TASK,
            imagineTask,
        );
        return 'ok';
    }

    @Post('img2img')
    async img2img(@Body() imagineTask: ImagineTaskDto): Promise<string> {
        await this.messagingService.send(
            Exchange.DEFAULT,
            RoutingKey.NEW_AI_ART_TASK,
            imagineTask,
        );
        return 'ok';
    }
}
