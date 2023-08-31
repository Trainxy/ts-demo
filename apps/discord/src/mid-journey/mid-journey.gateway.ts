import { Util } from '@app/lengendary/common';
import {
    Channel as MessagingChannel,
    Exchange,
    Queue,
    RoutingKey,
} from '@app/lengendary/common/enum/messaging';
import { CosProvider } from '@app/lengendary/cos/providers/cos.provider';
import { TaskLogger } from '@app/lengendary/logger/providers';
import { DiscordClientProvider, On, Once } from '@discord-nestjs/core';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import {
    MidjourneyTask,
    MidjourneyTaskStatus,
    MidjourneyTaskType,
} from '@prisma/client';

import { Message } from 'discord.js';
import * as _ from 'lodash';
import moment from 'moment';
import { DiscordApiService } from './discord-api.service';
import { DiscordMessageParser } from './discord-message.parser';
import { DiscordApiReqFailed, NoPaidAccountAvailable } from './errors';
import { ReferenceTaskNotFound } from './errors/reference-task-not-found.available.error';
import {
    FormattedPrompt,
    MidjourneyBotMessage,
    MidjourneyImageTask,
} from './interfaces';
import { MidJourneyService } from './mid-journey.service';

@Injectable()
export class MidJourneyGateWay {
    constructor(
        private readonly logger: TaskLogger,
        private util: Util,
        private readonly discordProvider: DiscordClientProvider,
        private readonly midJourneyService: MidJourneyService,
        private readonly discordApiService: DiscordApiService,
        private readonly cosService: CosProvider,
        private readonly messageParser: DiscordMessageParser,
    ) {}

    @Once('ready')
    onReady(): void {
        this.logger.info(
            `[Login] Logged in as ${
                this.discordProvider.getClient().user.tag
            }!`,
        );
    }

    @On('messageCreate')
    async onMessage(message: Message): Promise<void> {
        if (message.author.username !== 'Midjourney Bot') {
            return;
        }
        if (message.attachments.size > 0) {
            const midjourneyBotMessage: MidjourneyBotMessage =
                this.messageParser.parseMidjourneyBotMessage(message);
            this.logger.info(
                `[MidjourneyBotMessage] ${JSON.stringify(
                    midjourneyBotMessage,
                )}`,
            );
            const taskModel = await this.updateTaskByMidjourneyBotMessage(
                midjourneyBotMessage,
            );
            if (taskModel) {
                this.logger.info(`updated task status, id: ${taskModel.id}`);
                await this.midJourneyService.invokeTaskCallback(taskModel);
            }
        } else {
            await this.updateJobMessageIdByDiscordMessage(message);
        }
    }

    @RabbitSubscribe({
        exchange: Exchange.DEFAULT,
        routingKey: RoutingKey.NEW_DISCORD_MJ_FREE_TASK,
        queue: Queue.DISCORD_MJ_FREE_TASK,
        queueOptions: {
            channel: MessagingChannel.DEFAULT,
        },
    })
    async consumeFreeDiscordMjTask(task: MidjourneyImageTask) {
        this.logger.info('[NewFreeQueueMsg]: ' + JSON.stringify(task));
        let requeue = false;
        try {
            await this.handleDiscordMjTask(task);
        } catch (e) {
            this.logger.error(`[${e.name}] task: ${JSON.stringify(task)}`);
            requeue = await this.handleError(task, e);
        }
        if (requeue) {
            await this.util.sleep(5000);
            return new Nack(true);
        }
    }

    @RabbitSubscribe({
        exchange: Exchange.DEFAULT,
        routingKey: RoutingKey.NEW_DISCORD_MJ_PREMIUM_TASK,
        queue: Queue.DISCORD_MJ_PREMIUM_TASK,
        queueOptions: {
            channel: MessagingChannel.DEFAULT,
        },
    })
    async consumePremiumDiscordMjTask(task: MidjourneyImageTask) {
        this.logger.info('[NewFreeQueueMsg]: ' + JSON.stringify(task));
        let requeue = false;
        try {
            await this.handleDiscordMjTask(task);
        } catch (e) {
            this.logger.error(`[${e.name}] task: ${JSON.stringify(task)}`);
            requeue = await this.handleError(task, e);
        }
        if (requeue) {
            await this.util.sleep(5000);
            return new Nack(true);
        }
    }

    async handleError(
        task: MidjourneyImageTask,
        error: Error,
    ): Promise<boolean> {
        const inQueueSeconds = moment().diff(task.createdAt, 'seconds');
        this.logger.error(
            `[ErrrorHandler]: name: ${error.name}, msg: ${error.message}`,
        );
        if (error instanceof NoPaidAccountAvailable) {
            if (inQueueSeconds > 600) {
                const taskModel = await this.midJourneyService.createTask({
                    uuid: task.uuid,
                    client: task.client,
                    type: task.type,
                    accountType: task.accountType,
                    prompt: task.prompt,
                    index: _.toNumber(task.index),
                    status: MidjourneyTaskStatus.timeout,
                });
                this.logger.error(
                    '[DropTask]: ' + ', task: ' + JSON.stringify(task),
                );
                await this.midJourneyService.invokeTaskCallback(taskModel);
                return false;
            }
        }
        if (error instanceof ReferenceTaskNotFound) {
            return false;
        }
        if (error instanceof DiscordApiReqFailed) {
            const accountId = +error.message;
            await this.midJourneyService.incresePaidAccountErrTimes(accountId);
            const paidAccount = await this.midJourneyService.getPaidAccountById(
                accountId,
            );
            if (paidAccount.errTimes >= 5) {
                await this.midJourneyService.markPaidAccountOff(accountId);
                this.logger.error(
                    '[AccountOff]: ' + ', accountId: ' + accountId,
                );
            }
        }
        return true;
    }

    async handleDiscordMjTask(task: MidjourneyImageTask) {
        switch (task.type) {
            case MidjourneyTaskType.imagine:
                await this.generateImagineTask(task);
                break;
            case MidjourneyTaskType.variation:
                await this.generateVariationTask(task);
                break;
            case MidjourneyTaskType.upscale:
                await this.generateUpscaleTask(task);
                break;
        }
    }

    async generateImagineTask(task: MidjourneyImageTask) {
        const idlePaidAccount = await this.midJourneyService.getIdlePaidAccount(
            task.accountType,
        );
        const formattedPrompt: FormattedPrompt =
            this.messageParser.formatPrompt(task.prompt);
        /**
        if (this.util.stringContainsChinese(prompt)) {
            origPrompt = prompt;
            prompt = await this.util.googleTranslateToEn(origPrompt);
        } */
        await this.discordApiService.proxyImagine(
            formattedPrompt.hasPlaceHolder
                ? formattedPrompt.orig
                : formattedPrompt.formatted,
            idlePaidAccount,
        );
        const taskModel = await this.midJourneyService.createTask({
            uuid: task.uuid,
            client: task.client,
            accountId: idlePaidAccount.id,
            accountType: task.accountType,
            prompt: formattedPrompt.formatted,
            origPrompt: formattedPrompt.orig,
            type: MidjourneyTaskType.imagine,
            status: MidjourneyTaskStatus.started,
        });
        this.logger.info(
            `[NewTask] id: ${taskModel.id}, type: ${taskModel.type}, index: ${taskModel.index}`,
        );
        await this.midJourneyService.invokeTaskCallback(taskModel);
    }

    async generateUpscaleTask(task: MidjourneyImageTask) {
        const fromTask = await this.midJourneyService.getTaskByUuid(
            task.fromTaskUuid,
        );
        if (_.isEmpty(fromTask)) {
            throw new ReferenceTaskNotFound(task.fromTaskUuid);
        }
        const account = await this.midJourneyService.getPaidAccountById(
            fromTask.accountId,
        );
        await this.discordApiService.proxyUpscale(
            task.index,
            fromTask,
            account,
        );
        const taskModel = await this.midJourneyService.createTask({
            uuid: task.uuid,
            client: task.client,
            accountId: account.id,
            accountType: task.accountType,
            fromTaskId: fromTask.id,
            prompt: fromTask.prompt,
            type: MidjourneyTaskType.upscale,
            index: _.toNumber(task.index),
            status: MidjourneyTaskStatus.started,
        });
        this.logger.info(
            `[NewTask] id: ${taskModel.id}, type: ${taskModel.type}, index: ${taskModel.index}`,
        );
        await this.midJourneyService.invokeTaskCallback(taskModel);
    }

    async generateVariationTask(task: MidjourneyImageTask) {
        const fromTask = await this.midJourneyService.getTaskByUuid(
            task.fromTaskUuid,
        );
        if (_.isEmpty(fromTask)) {
            throw new ReferenceTaskNotFound(task.fromTaskUuid);
        }
        const account = await this.midJourneyService.getPaidAccountById(
            fromTask.accountId,
        );
        await this.discordApiService.proxyVariation(
            task.index,
            fromTask,
            account,
        );
        const taskModel = await this.midJourneyService.createTask({
            uuid: task.uuid,
            client: task.client,
            accountId: account.id,
            accountType: task.accountType,
            fromTaskId: fromTask.id,
            prompt: fromTask.prompt,
            type: MidjourneyTaskType.variation,
            index: _.toNumber(task.index),
            status: MidjourneyTaskStatus.started,
        });
        this.logger.info(
            `[NewTask] id: ${taskModel.id}, type: ${taskModel.type}, index: ${taskModel.index}`,
        );
        await this.midJourneyService.invokeTaskCallback(taskModel);
    }

    async updateJobMessageIdByDiscordMessage(message: Message) {
        const mjConvertedPromptString =
            this.messageParser.parsePromptFromBotMessage(message);

        const prompt = this.messageParser.promptContainsUrl(
            mjConvertedPromptString,
        )
            ? this.messageParser.replaceConvertedPromptUrlWithPlaceHolder(
                  mjConvertedPromptString,
              )
            : mjConvertedPromptString;
        const task = await this.midJourneyService.getStartedTaskByPrompt(
            prompt,
        );
        if (_.isEmpty(task)) {
            this.logger.error('[TaskNotFoundByPrompt] prompt: ' + prompt);
            return;
        }
        this.logger.info(
            `[UpdateTaskJobMessage] taskUuid: ${task.uuid} id: ${message.id}, content: ${message.content},author: ${message.author.username}`,
        );
        const updateParams: any = {
            jobMessageId: message.id,
            prompt: mjConvertedPromptString,
        };
        this.logger.info(
            `[UpdateTaskPrompt] from: ${task.prompt}, to: ${updateParams.prompt}`,
        );
        return this.midJourneyService.updateTaskById(task.id, updateParams);
    }

    async updateTaskByMidjourneyBotMessage(
        midjourneyBotMessage: MidjourneyBotMessage,
    ): Promise<MidjourneyTask> {
        const task =
            await this.midJourneyService.getUnCompletedTaskByPromptAndType(
                midjourneyBotMessage.prompt,
                midjourneyBotMessage.taskType,
            );
        const imageCosLocation =
            [
                'midjourney',
                moment().format('YYYY/MMDD'),
                midjourneyBotMessage.messageId,
            ].join('/') + '.png';
        await this.cosService.transferRemoteFileToCos(
            midjourneyBotMessage.imageUrl,
            imageCosLocation,
        );
        if (task) {
            return this.midJourneyService.updateTaskById(task.id, {
                messageId: midjourneyBotMessage.messageId,
                messageHash: midjourneyBotMessage.messageHash,
                imageUrl: midjourneyBotMessage.imageUrl,
                imageCosLocation,
                imageGridNumber: midjourneyBotMessage.imageGridNumber,
                components: JSON.stringify(midjourneyBotMessage.components),
                status: MidjourneyTaskStatus.completed,
                updatedAt: new Date(),
            });
        }
    }
}
