import {
    MidjourneyTaskAccountType,
    MidjourneyTaskClient,
    MidjourneyTaskType,
} from '@prisma/client';

export interface MidjourneyImageTask {
    uuid: string;
    client: MidjourneyTaskClient;
    accountType: MidjourneyTaskAccountType;
    createdAt: string;
    type: MidjourneyTaskType;
    prompt?: string;
    index?: number;
    fromTaskUuid?: string;
}
