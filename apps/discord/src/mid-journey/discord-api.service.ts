import { TaskLogger } from '@app/lengendary/logger/providers';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MidjourneyPaidAccount, MidjourneyTask } from '@prisma/client';
import axios from 'axios';
import { DiscordApiReqFailed } from './errors';

@Injectable()
export class DiscordApiService {
    constructor(
        private readonly logger: TaskLogger,
        private config: ConfigService,
    ) {}

    async proxyVariation(
        index: number,
        fromTask: MidjourneyTask,
        account: MidjourneyPaidAccount,
    ) {
        const payload = {
            type: 3,
            guild_id: account.serverId,
            channel_id: account.channelId,
            message_flags: 0,
            message_id: fromTask.messageId,
            application_id: 'application_id',
            session_id: 'session_id',
            data: {
                component_type: 2,
                custom_id: `MJ::JOB::variation::${index}::${fromTask.messageHash}`,
            },
        };
        const headers = {
            authorization: account.accountToken,
        };
        try {
            await axios.post(
                'https://discord.com/api/v9/interactions',
                payload,
                {
                    headers,
                },
            );
        } catch (e) {
            this.logger.info(
                `proxyVariation failed, ${JSON.stringify(e.response)}`,
            );
            throw new DiscordApiReqFailed(account.id.toString());
        }
    }

    async proxyUpscale(
        index: number,
        fromTask: MidjourneyTask,
        account: MidjourneyPaidAccount,
    ) {
        const payload = {
            type: 3,
            guild_id: account.serverId,
            channel_id: account.channelId,
            message_flags: 0,
            message_id: fromTask.messageId,
            application_id: 'application_id',
            session_id: 'session_id',
            data: {
                component_type: 2,
                custom_id: `MJ::JOB::upsample::${index}::${fromTask.messageHash}`,
            },
        };
        const headers = {
            authorization: account.accountToken,
        };
        try {
            await axios.post(
                'https://discord.com/api/v9/interactions',
                payload,
                {
                    headers,
                },
            );
        } catch (e) {
            this.logger.info(
                `proxyUpscale failed, ${JSON.stringify(e.response)}`,
            );
            throw new DiscordApiReqFailed(account.id.toString());
        }
    }

    async proxyImagine(prompt: string, account: MidjourneyPaidAccount) {
        const payload = {
            type: 2,
            application_id: 'application_id',
            guild_id: account.serverId,
            channel_id: account.channelId,
            session_id: 'session_id',
            data: {
                version: 'version',
                id: 'id',
                name: 'imagine',
                type: 1,
                options: [{ type: 3, name: 'prompt', value: prompt }],
                application_command: {
                    id: 'id',
                    application_id: 'application_id',
                    version: 'version',
                    default_permission: true,
                    default_member_permissions: null,
                    type: 1,
                    nsfw: false,
                    name: 'imagine',
                    description: 'Create images with Midjourney',
                    dm_permission: true,
                    options: [
                        {
                            type: 3,
                            name: 'prompt',
                            description: 'The prompt to imagine',
                            required: true,
                        },
                    ],
                },
                attachments: [],
            },
        };
        const headers = {
            authorization: account.accountToken,
        };
        try {
            await axios.post(
                'https://discord.com/api/v9/interactions',
                payload,
                {
                    headers,
                },
            );
        } catch (e) {
            this.logger.error(
                `proxyImagine failed, ${JSON.stringify(e.response)}`,
            );
            throw new DiscordApiReqFailed(account.id.toString());
        }
    }

    async proxyInfo(account: MidjourneyPaidAccount) {
        const payload = {
            type: 2,
            application_id: 'application_id',
            guild_id: account.serverId,
            channel_id: account.channelId,
            session_id: 'session_id',
            data: {
                version: 'version',
                id: 'idj',
                name: 'info',
                type: 1,
                options: [],
                application_command: {
                    id: 'idj',
                    application_id: 'application_id',
                    version: 'version',
                    default_permission: true,
                    default_member_permissions: null,
                    type: 1,
                    nsfw: false,
                    name: 'info',
                    description: 'View information about your profile.',
                    dm_permission: true,
                },
                attachments: [],
            },
        };
        const headers = {
            authorization: account.accountToken,
        };
        try {
            await axios.post(
                'https://discord.com/api/v9/interactions',
                payload,
                {
                    headers,
                },
            );
        } catch (e) {
            this.logger.error(
                `proxyInfo failed, ${JSON.stringify(e.response)}`,
            );
            throw new DiscordApiReqFailed(account.id.toString());
        }
    }

    async cancelImagineJob(
        task: MidjourneyTask,
        account: MidjourneyPaidAccount,
    ) {
        const payload = {
            type: 2,
            application_id: 'application_id',
            guild_id: account.serverId,
            channel_id: account.channelId,
            session_id: 'session_id',
            data: {
                version: 'version',
                id: 'id',
                name: 'Cancel Job',
                type: 3,
                options: [],
                application_command: {
                    id: 'id',
                    application_id: 'application_id',
                    version: 'version',
                    default_permission: true,
                    default_member_permissions: null,
                    type: 3,
                    nsfw: false,
                    name: 'Cancel Job',
                    description: '',
                    dm_permission: true,
                },
                target_id: task.jobMessageId,
                attachments: [],
            },
        };
        const headers = {
            'Content-Type': 'multipart/form-data',
            authorization: account.accountToken,
        };
        this.logger.info(
            `cancel job payload: ${JSON.stringify(
                payload,
            )}, header: ${JSON.stringify(headers)}`,
        );
        const form = new FormData();
        form.append('payload_json', JSON.stringify(payload));
        try {
            await axios.post('https://discord.com/api/v9/interactions', form, {
                headers,
            });
        } catch (e) {
            this.logger.error(
                `cancelJob failed, ${JSON.stringify(e.response.data.errors)}`,
            );
            throw new DiscordApiReqFailed(account.id.toString());
        }
    }

    async cancelSecondaryJob(
        index: number,
        fromTask: MidjourneyTask,
        account: MidjourneyPaidAccount,
    ) {
        const payload = {
            type: 3,
            guild_id: account.serverId,
            channel_id: account.channelId,
            message_flags: 64,
            message_id: fromTask.messageId,
            application_id: 'application_id',
            session_id: 'session_id',
            data: {
                component_type: 2,
                custom_id: `MJ::CancelJob::ByJobid::${fromTask.messageHash}`,
            },
        };
        const headers = {
            authorization: account.accountToken,
        };
        try {
            await axios.post(
                'https://discord.com/api/v9/interactions',
                payload,
                {
                    headers,
                },
            );
        } catch (e) {
            this.logger.info(
                `proxyUpscale failed, ${JSON.stringify(e.response)}`,
            );
            throw new DiscordApiReqFailed(account.id.toString());
        }
    }
}
