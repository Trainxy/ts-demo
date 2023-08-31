import { ImagineTaskStatus } from '../enum';

export class SdTxt2ImgRequestDto {
    sd_model_checkpoint: string;
    prompt: string;
    negative_prompt: string;
    sampler_index?: string;
    width: number;
    height: number;
    denoising_strength?: number;
    cfg_scale?: number;
    steps: number;
}

export class SdImg2ImgRequestDto {
    sd_model_checkpoint: string;
    prompt: string;
    negative_prompt: string;
    sampler_index?: string;
    width: number;
    height: number;
    denoising_strength?: number;
    cfg_scale?: number;
    steps: number;
    init_images?: string[];
}

export class ImagineTaskDto {
    uuid: string;
    accountUuid: string;
    callbackUrl?: string;
    referenceImage?: string;
    sdTxt2ImgParams?: SdTxt2ImgRequestDto;
    sdImg2ImgParams?: SdImg2ImgRequestDto;
}

export class ImagineTaskCallbackDto {
    uuid: string;
    status: ImagineTaskStatus;
    progress: number;
    imageCosLocationList?: string[];
}
