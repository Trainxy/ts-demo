import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/lengendary/prisma';
import * as _ from 'lodash';
import {
    MidjourneyPaidAccount,
    MidjourneyPaidAccountStatus,
    MidjourneyPaidAccountType,
    MidjourneyTask,
    MidjourneyTaskStatus,
    MidjourneyTaskType,
    Prisma,
} from '@prisma/client';
import { ClientCallback } from './interfaces';
import { NoPaidAccountAvailable } from './errors';
import axios from 'axios';
import { TaskLogger } from '@app/lengendary/logger/providers';
import { Cron, CronExpression } from '@nestjs/schedule';
import moment from 'moment';
import { DiscordApiService } from './discord-api.service';

@Injectable()
export class MidJourneyService {
    constructor(
        private readonly logger: TaskLogger,
        private configService: ConfigService,
        private prisma: PrismaService,
        private readonly discordApiService: DiscordApiService,
    ) {}

    // @Cron(new Date(Date.now() + 20 * 1000))
    async test() {
        const account = await this.getIdlePaidAccount(
            MidjourneyPaidAccountType.free,
        );
        const valid = await this.checkAccountValid(account);
        console.log(valid);
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async checkTaskTimeout() {
        const tasks = await this.prisma.midjourneyTask.findMany({
            where: {
                status: MidjourneyTaskStatus.started,
            },
        });
        const expireTasks = _.filter(tasks, (task) => {
            return (
                moment().diff(moment(task.createdAt), 'second') >
                this.configService.get('discord.midjourney.taskTimeoutSecond')
            );
        });
        if (expireTasks.length === 0) {
            return;
        }
        this.logger.info(
            `mark task timeout，total: ${expireTasks.length}, ids: ${expireTasks
                .map((task) => task.id)
                .join(', ')}`,
        );
        for (const task of expireTasks) {
            await this.updateTaskById(task.id, {
                status: MidjourneyTaskStatus.timeout,
            });
            task.status = MidjourneyTaskStatus.timeout;
            await this.invokeTaskCallback(task);
            await this.cancelTask(task);
        }
    }

    async createTask(
        task: Prisma.MidjourneyTaskCreateInput,
    ): Promise<MidjourneyTask> {
        return this.prisma.midjourneyTask.create({
            data: task,
        });
    }

    async updateTaskById(id: number, data: Prisma.MidjourneyTaskUpdateInput) {
        return this.prisma.midjourneyTask.update({
            where: {
                id,
            },
            data,
        });
    }

    async getTaskByUuid(uuid: string) {
        return this.prisma.midjourneyTask.findUnique({
            where: {
                uuid,
            },
        });
    }

    async getTaskByMessageId(messageId: string) {
        return this.prisma.midjourneyTask.findUnique({
            where: {
                messageId,
            },
        });
    }

    async getPaidAccountById(id: number) {
        return this.prisma.midjourneyPaidAccount.findUnique({
            where: {
                id,
            },
        });
    }

    async getIdlePaidAccount(type: MidjourneyPaidAccountType) {
        const paidAccounts = await this.prisma.midjourneyPaidAccount.findMany({
            where: {
                status: MidjourneyPaidAccountStatus.on,
                type,
            },
        });
        if (paidAccounts.length === 0) {
            throw new NoPaidAccountAvailable();
        }
        const waitingTasks = await this.prisma.midjourneyTask.findMany({
            where: {
                status: MidjourneyTaskStatus.started,
            },
        });
        const idlePaidAccounts = _.filter(paidAccounts, (paidAccount) => {
            const curAccountWaitingTasks = _.filter(waitingTasks, {
                accountId: paidAccount.id,
            });
            if (
                curAccountWaitingTasks.length <=
                this.configService.get('discord.midjourney.maxWaitingPoolSize')
            ) {
                return true;
            }
        });
        if (idlePaidAccounts.length === 0) {
            throw new NoPaidAccountAvailable();
        }
        return _.sample(idlePaidAccounts);
    }

    async getStartedTaskByPrompt(prompt: string): Promise<MidjourneyTask> {
        return this.prisma.midjourneyTask.findFirst({
            where: {
                prompt,
                status: MidjourneyTaskStatus.started,
            },
        });
    }

    async getUnCompletedTaskByPromptAndType(
        prompt: string,
        type: MidjourneyTaskType,
    ): Promise<MidjourneyTask> {
        return this.prisma.midjourneyTask.findFirst({
            where: {
                prompt,
                type,
                status: {
                    in: [
                        MidjourneyTaskStatus.started,
                        MidjourneyTaskStatus.timeout,
                    ],
                },
            },
            orderBy: {
                id: 'desc',
            },
        });
    }

    getImageUrlFromTask(task: MidjourneyTask) {
        if (task.imageCosLocation === null) {
            return '';
        }
        return (
            this.configService.get('cos.midjourney.domain') +
            task.imageCosLocation
        );
    }

    async incresePaidAccountErrTimes(accountId: number) {
        return this.prisma.midjourneyPaidAccount.update({
            where: {
                id: accountId,
            },
            data: {
                errTimes: {
                    increment: 1,
                },
            },
        });
    }

    async markPaidAccountOff(accountId: number) {
        return this.prisma.midjourneyPaidAccount.update({
            where: {
                id: accountId,
            },
            data: {
                status: MidjourneyPaidAccountStatus.off,
            },
        });
    }

    async invokeTaskCallback(task: MidjourneyTask) {
        const url = {
            mj_test: 'http://paygougouccnu.mynatapp.cc/callback/aiPainting',
            mj_prod: 'https://api.videoapps.cn/callback/aiPainting',
        };
        const params: ClientCallback = {
            uuid: task.uuid,
            status: task.status,
        };
        if (task.imageCosLocation !== null) {
            params.imageUrl = this.getImageUrlFromTask(task);
            params.imageGridNumber = task.imageGridNumber;
        }
        try {
            const result = await axios.post(url[task.client], params);
            this.logger.info(
                `任务回调成功，params: ${JSON.stringify(
                    params,
                )}, result: ${JSON.stringify(result.data)}`,
            );
        } catch (e) {
            this.logger.error(
                `任务回调失败，params: ${JSON.stringify(
                    params,
                )}, msg: ${JSON.stringify(e.message)}`,
            );
        }
    }

    async checkAccountValid(account: MidjourneyPaidAccount): Promise<boolean> {
        try {
            await this.discordApiService.proxyInfo(account);
        } catch (e) {
            return false;
        }
        return true;
    }

    async cancelTask(task: MidjourneyTask): Promise<boolean> {
        const account = await this.getPaidAccountById(task.accountId);

        try {
            if (task.type == MidjourneyTaskType.imagine) {
                await this.discordApiService.cancelImagineJob(task, account);
            }
        } catch (e) {
            return false;
        }
        return true;
    }
}
