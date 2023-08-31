import { MidjourneyTaskStatus } from '@prisma/client';

export interface ClientCallback {
    uuid: string;
    status: MidjourneyTaskStatus;
    imageUrl?: string;
    imageGridNumber?: number;
}
