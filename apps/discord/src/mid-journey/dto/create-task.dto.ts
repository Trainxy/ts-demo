import {
    MidjourneyTaskAccountType,
    MidjourneyTaskClient,
    MidjourneyTaskType,
} from '@prisma/client';
import {
    IsInt,
    IsString,
    IsEnum,
    IsNotEmpty,
    ValidateIf,
} from 'class-validator';

export class CreateTaskDto {
    @IsEnum(MidjourneyTaskClient)
    readonly client: MidjourneyTaskClient;

    @IsString()
    @IsNotEmpty()
    readonly type: MidjourneyTaskType;

    readonly accountType: MidjourneyTaskAccountType;

    @IsString()
    @ValidateIf((o) => o.type === MidjourneyTaskType.imagine)
    @IsNotEmpty()
    readonly prompt?: string;

    // @IsInt()
    @ValidateIf((o) =>
        [MidjourneyTaskType.variation, MidjourneyTaskType.upscale].includes(
            o.type,
        ),
    )
    @IsNotEmpty()
    readonly index?: number;

    @IsString()
    @ValidateIf((o) =>
        [MidjourneyTaskType.variation, MidjourneyTaskType.upscale].includes(
            o.type,
        ),
    )
    @IsNotEmpty()
    readonly fromTaskUuid?: string;
}

export class CreateTaskResultDto {
    @IsString()
    readonly uuid?: string;
}
