import { Injectable } from '@nestjs/common';
import { MidjourneyTaskType } from '@prisma/client';
import { Message } from 'discord.js';
import { FormattedPrompt, MidjourneyBotMessage } from './interfaces';
import * as _ from 'lodash';
import { ConfigService } from '@nestjs/config';
import { DebugLogger } from '@app/lengendary/logger/providers';

@Injectable()
export class DiscordMessageParser {
    constructor(
        private configService: ConfigService,
        private readonly debugLogger: DebugLogger,
    ) {}

    formatPrompt(prompt: string): FormattedPrompt {
        let hasPlaceHolder = false;
        let orig = null;
        let formatted = prompt
            .replace(/\s\s+/g, ' ')
            .replace(/[\r\n]/gm, '')
            .trim();
        if (this.promptContainsUrl(formatted)) {
            orig = formatted;
            formatted = this.replacePromptUrlWithPlaceHolder(orig);
            hasPlaceHolder = true;
        }
        return { orig, formatted, hasPlaceHolder };
    }

    promptContainsUrl(prompt: string): boolean {
        const urls = prompt.match(/(https?:\/\/[^\s]+)/g);
        return urls !== null;
    }

    replacePromptUrlWithPlaceHolder(prompt: string): string {
        return prompt.replace(
            /(https?:\/\/[^\s]+)/g,
            this.configService.get('discord.midjourney.imageUrlPlaceHolder'),
        );
    }

    replaceConvertedPromptUrlWithPlaceHolder(prompt: string): string {
        return prompt.replace(
            /(<https?:\/\/[^\s]+>)/g,
            this.configService.get('discord.midjourney.imageUrlPlaceHolder'),
        );
    }

    replacePlaceHolderByConvertedPrompt(
        prompt: string,
        convertedPrompt: string,
    ): string {
        const convertedUrls = convertedPrompt.match(/(<https?:\/\/[^\s]+>)/g);
        convertedUrls.forEach(
            (url) =>
                (prompt = prompt.replace(
                    this.configService.get(
                        'discord.midjourney.imageUrlPlaceHolder',
                    ),
                    url,
                )),
        );
        return prompt;
    }

    parsePromptFromBotMessage(message: Message) {
        return message.content.split('**')[1];
    }

    parseMidjourneyBotMessage(message: Message): MidjourneyBotMessage {
        const parsedMessage: MidjourneyBotMessage = {
            messageId: message.id,
            prompt: this.parsePromptFromBotMessage(message),
            taskType: this.parseMidjourneyTaskTypeFromMessageContent(
                message.content,
            ),
            imageGridNumber: 1,
        };
        if (message.reference) {
            parsedMessage.referenceMessageId = message.reference.messageId;
        }
        if (
            message.components.length > 0 &&
            parsedMessage.taskType === MidjourneyTaskType.imagine
        ) {
            const components = _.flatten(
                _.map(message.components, 'components'),
            );
            const upscaleButtons = _.filter(
                components,
                (button) =>
                    button.data.hasOwnProperty('label') &&
                    button.data.label[0] === 'U',
            );
            this.debugLogger.info(JSON.stringify(components));
            parsedMessage.imageGridNumber = upscaleButtons.length;
            parsedMessage.components = components;
        }

        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            if (attachment) {
                parsedMessage.imageUrl = attachment.url;
                parsedMessage.messageHash = attachment.url
                    .split('_')
                    .pop()
                    .split('.')[0];
            }
        }
        return parsedMessage;
    }

    parseMidjourneyTaskTypeFromMessageContent(
        content: string,
    ): MidjourneyTaskType {
        if (/.*Upscaled (\(Beta\) ){0,}by <@\d{19}>*/.test(content)) {
            return MidjourneyTaskType.upscale;
        }
        if (/.*Image #\d <@\d{19}>*/.test(content)) {
            return MidjourneyTaskType.upscale;
        }
        if (/.*Variations (\(Beta\) ){0,}by <@\d{19}>*/.test(content)) {
            return MidjourneyTaskType.variation;
        }
        return MidjourneyTaskType.imagine;
    }
}
