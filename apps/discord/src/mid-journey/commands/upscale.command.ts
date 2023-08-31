import { Command, Handler } from '@discord-nestjs/core';
import { ContextMenuCommandInteraction } from 'discord.js';

@Command({
    name: 'mjf_upscale',
    description: 'upscale an image from imagine candicate images.',
})
export class UpscaleCommand {
    @Handler()
    onUpscaleCommand(interaction: ContextMenuCommandInteraction): string {
        console.log(interaction);

        return 'Upscale';
    }
}
