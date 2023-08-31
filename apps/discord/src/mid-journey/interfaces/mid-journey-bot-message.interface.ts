import { MidjourneyTaskType } from '@prisma/client';

export interface MidjourneyBotMessage {
    messageId: string;
    messageHash?: string;
    referenceMessageId?: string;
    prompt: string;
    taskType: MidjourneyTaskType;
    imageUrl?: string;
    imageGridNumber?: number;
    components?: any[];
}
