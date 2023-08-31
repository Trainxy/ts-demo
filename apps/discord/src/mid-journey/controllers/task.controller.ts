import { Body, Controller, Post } from '@nestjs/common';
import { MessagingService } from '@app/lengendary/messaging';
import { MidJourneyService } from '../mid-journey.service';
import { Exchange, RoutingKey } from '@app/lengendary/common/enum/messaging';
import { MidjourneyImageTask } from '../interfaces';
import {
    MidjourneyTaskAccountType,
    MidjourneyTaskStatus,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
    CancelTaskDto,
    CancelTaskResultDto,
    CreateTaskDto,
    CreateTaskResultDto,
    QueryTaskDto,
    QueryTaskResultDto,
} from '../dto';
import { TaskNotFound } from '../errors';
import * as _ from 'lodash';

@Controller('mj/task')
export class MidjourneyTaskController {
    constructor(
        private readonly messagingService: MessagingService,
        private readonly midjourneyService: MidJourneyService,
    ) {}

    @Post('create')
    public async createTask(
        @Body() createTaskDto: CreateTaskDto,
    ): Promise<CreateTaskResultDto> {
        const uuid = uuidv4();
        const queueTask: MidjourneyImageTask = Object.assign(
            {
                uuid,
                client: createTaskDto.client,
                type: createTaskDto.type,
                createdAt: new Date().toISOString(),
                accountType: MidjourneyTaskAccountType.premium,
            },
            createTaskDto,
        );
        const routingKey =
            queueTask.accountType === MidjourneyTaskAccountType.premium
                ? RoutingKey.NEW_DISCORD_MJ_PREMIUM_TASK
                : RoutingKey.NEW_DISCORD_MJ_FREE_TASK;
        await this.messagingService.send(
            Exchange.DEFAULT,
            routingKey,
            queueTask,
        );
        return {
            uuid,
        };
    }

    @Post('query')
    public async queryTask(
        @Body() queryTaskDto: QueryTaskDto,
    ): Promise<QueryTaskResultDto> {
        const task = await this.midjourneyService.getTaskByUuid(
            queryTaskDto.uuid,
        );
        if (task && task.status === MidjourneyTaskStatus.completed) {
            return {
                uuid: queryTaskDto.uuid,
                status: task.status,
                imageUrl: this.midjourneyService.getImageUrlFromTask(task),
            };
        }
        return {
            uuid: queryTaskDto.uuid,
            status: task ? task.status : MidjourneyTaskStatus.waiting,
        };
    }

    @Post('cancel')
    public async cancelTask(
        @Body() cancelTaskDto: CancelTaskDto,
    ): Promise<CancelTaskResultDto> {
        const task = await this.midjourneyService.getTaskByUuid(
            cancelTaskDto.uuid,
        );
        if (_.isEmpty(task)) {
            throw new TaskNotFound(cancelTaskDto.uuid);
        }
        await this.midjourneyService.updateTaskById(task.id, {
            status: MidjourneyTaskStatus.timeout,
        });
        task.status = MidjourneyTaskStatus.timeout;
        await this.midjourneyService.invokeTaskCallback(task);

        const success = await this.midjourneyService.cancelTask(task);
        return {
            success,
        };
    }
}
