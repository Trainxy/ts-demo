import { MidjourneyTaskStatus } from '@prisma/client';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class CancelTaskDto {
    @IsString()
    @IsNotEmpty()
    readonly uuid: string;
}

export class QueryTaskDto {
    @IsString()
    @IsNotEmpty()
    readonly uuid: string;
}

export class QueryTaskResultDto {
    @IsString()
    readonly uuid: string;

    @IsEnum(MidjourneyTaskStatus)
    readonly status: MidjourneyTaskStatus;

    @IsString()
    readonly imageUrl?: string;
}

export class CancelTaskResultDto {
    readonly success: boolean;
}
