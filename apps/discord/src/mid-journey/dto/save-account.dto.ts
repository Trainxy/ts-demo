import { IsString, IsNotEmpty } from 'class-validator';

export class SaveAccountDto {
    @IsNotEmpty()
    @IsString()
    readonly name: string;

    @IsNotEmpty()
    @IsString()
    readonly token: string;
}

export class SaveAccountResultDto {
    readonly success: boolean;
}
