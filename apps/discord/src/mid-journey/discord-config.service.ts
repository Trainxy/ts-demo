import {
    DiscordModuleOption,
    DiscordOptionsFactory,
} from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayIntentBits } from 'discord.js';

@Injectable()
export class DiscordConfigService implements DiscordOptionsFactory {
    constructor(private configService: ConfigService) {}

    createDiscordOptions(): DiscordModuleOption {
        return {
            token: this.configService.get('discord.bots.mjForwarder.token'),
            discordClientOptions: {
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent,
                ],
            },
        };
    }
}
