import { SlashCommandPipe } from '@discord-nestjs/common';
import {
    Command,
    Handler,
    InteractionEvent,
    Param,
} from '@discord-nestjs/core';

class ImagineDto {
    @Param({
        description: 'prompt text to imagine',
        required: true,
    })
    content: string;
}

@Command({
    name: 'mjf-imagine',
    description: 'MjForwarder imagine from prompt text.',
})
export class ImagineCommand {
    @Handler()
    onImagineCommand(
        @InteractionEvent(SlashCommandPipe) options: ImagineDto,
    ): string {
        console.log(options);

        return 'Imagine';
    }
}
