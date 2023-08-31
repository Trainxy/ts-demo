import { Inject, Injectable } from '@nestjs/common';
import {
    ImagineTaskCallbackDto,
    ImagineTaskDto,
    SdImg2ImgRequestDto,
    SdTxt2ImgRequestDto,
} from './dto';
import { AiArtLogger } from '@app/lengendary/logger/providers';
import { ConfigService } from '@nestjs/config';
import { ImagineTaskStatus } from './enum';
import { CosProvider } from '@app/lengendary/cos/providers/cos.provider';
import axios from 'axios';
import moment from 'moment';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
    Channel,
    Exchange,
    Queue,
    RoutingKey,
} from '@app/lengendary/common/enum/messaging';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AiArtService {
    constructor(
        private readonly logger: AiArtLogger,
        private readonly configService: ConfigService,
        private readonly cosService: CosProvider,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) {}

    private readonly currentTaskUuidCacheKey = 'ai-art:current:task:uuid';

    @RabbitSubscribe({
        exchange: Exchange.DEFAULT,
        routingKey: RoutingKey.NEW_AI_ART_TASK,
        queue: Queue.AI_ART_TASK,
        queueOptions: {
            channel: Channel.DEFAULT,
        },
    })
    async consumeTxt2ImgTask(imagineTask: ImagineTaskDto) {
        const {
            uuid,
            accountUuid,
            callbackUrl,
            referenceImage,
            sdTxt2ImgParams,
            sdImg2ImgParams,
        } = imagineTask;
        let imageCosLocationList = [];

        if (referenceImage) {
            imageCosLocationList = await this.img2img(
                uuid,
                accountUuid,
                referenceImage,
                sdImg2ImgParams,
            );
        } else {
            imageCosLocationList = await this.txt2img(
                uuid,
                accountUuid,
                sdTxt2ImgParams,
            );
        }
        const status =
            imageCosLocationList.length > 0
                ? ImagineTaskStatus.COMPLETED
                : ImagineTaskStatus.FAILED;
        await this.notifyCallback(
            uuid,
            status,
            100,
            imageCosLocationList,
            callbackUrl,
        );
    }

    async img2img(
        uuid: string,
        accountUuid: string,
        referenceImageCosLocation: string,
        img2ImgParams: SdImg2ImgRequestDto,
    ): Promise<string[]> {
        const apiUrl = this.configService.get('api.stableDiffusion.img2img');
        const timeout = 60000;
        const headers = {
            'Content-Type': 'application/json',
            Authorization: 'Basic c3FrajplNmVMNVo3NWlHcjY=',
        };
        const referenceImageBase64 = await this.cosService.readFileToBase64(
            referenceImageCosLocation,
        );
        img2ImgParams.init_images = [referenceImageBase64];
        try {
            this.logger.info(
                `requesting sd img2img api, params: ${JSON.stringify(
                    img2ImgParams,
                )}`,
            );
            await this.setCurrentTask(uuid);
            const beginTime = Date.now();
            const result = await axios.post(apiUrl, img2ImgParams, {
                headers,
                timeout,
            });
            const endTime = Date.now();
            const timeDiffSecond = (endTime - beginTime) / 1000;
            await this.clearCurrentTask();

            this.logger.info(
                `requested sd img2img success, params: ${JSON.stringify(
                    img2ImgParams,
                )}, costSeconds: ${timeDiffSecond}`,
            );
            const { images } = result.data;
            const imageCosLocationList: string[] = [];
            for (const [index, image] of images.entries()) {
                const base64Data = image.replace(
                    /^data:image\/\w+;base64,/,
                    '',
                );
                const imageBuffer = Buffer.from(base64Data, 'base64');
                const cosLocation = [
                    this.configService.get('cos.aiArt.prefix'),
                    accountUuid.substring(0, 2),
                    accountUuid,
                    `${moment().format('YYYYMMDD')}-${uuid.substring(
                        0,
                        4,
                    )}-${index}.jpg`,
                ].join('/');
                await this.cosService.uploadBufferToCos(
                    imageBuffer,
                    cosLocation,
                );
                imageCosLocationList.push(cosLocation);
            }

            console.log(imageCosLocationList);
            return imageCosLocationList;
        } catch (e) {
            this.logger.error(
                `requested sd img2img error, params: ${JSON.stringify(
                    img2ImgParams,
                )}, error: ${e.stack}`,
            );
        }
        return [];
    }

    async txt2img(
        uuid: string,
        accountUuid: string,
        txt2ImgParams: SdTxt2ImgRequestDto,
    ): Promise<string[]> {
        const apiUrl = this.configService.get('api.stableDiffusion.txt2img');
        const timeout = 60000;
        const headers = {
            'Content-Type': 'application/json',
            Authorization: 'Basic c3FrajplNmVMNVo3NWlHcjY=',
        };
        try {
            this.logger.info(
                `requesting sd txt2img api, params: ${JSON.stringify(
                    txt2ImgParams,
                )}`,
            );
            await this.setCurrentTask(uuid);
            const beginTime = Date.now();
            const result = await axios.post(apiUrl, txt2ImgParams, {
                headers,
                timeout,
            });
            const endTime = Date.now();
            const timeDiffSecond = (endTime - beginTime) / 1000;
            await this.clearCurrentTask();

            this.logger.info(
                `requested sd txt2img success, params: ${JSON.stringify(
                    txt2ImgParams,
                )}, costSeconds: ${timeDiffSecond}`,
            );
            const { images } = result.data;
            const imageCosLocationList: string[] = [];
            for (const [index, image] of images.entries()) {
                const base64Data = image.replace(
                    /^data:image\/\w+;base64,/,
                    '',
                );
                const imageBuffer = Buffer.from(base64Data, 'base64');
                const cosLocation = [
                    this.configService.get('cos.aiArt.prefix'),
                    accountUuid.substring(0, 2),
                    accountUuid,
                    `${moment().format('YYYYMMDD')}-${uuid.substring(
                        0,
                        4,
                    )}-${index}.jpg`,
                ].join('/');
                await this.cosService.uploadBufferToCos(
                    imageBuffer,
                    cosLocation,
                );
                imageCosLocationList.push(cosLocation);
            }

            console.log(imageCosLocationList);
            return imageCosLocationList;
        } catch (e) {
            this.logger.error(
                `requested sd txt2img error, params: ${JSON.stringify(
                    txt2ImgParams,
                )}, error: ${e.stack}`,
            );
        }
        return [];
    }

    async notifyCallback(
        uuid: string,
        status: ImagineTaskStatus,
        progress: number,
        imageCosLocationList?: string[],
        callbackUrl?: string,
    ): Promise<boolean> {
        const notifyUrl =
            undefined !== callbackUrl && '' !== callbackUrl
                ? callbackUrl
                : this.configService.get('callback.aiArt');
        const playload: ImagineTaskCallbackDto = {
            uuid,
            status,
            progress,
            imageCosLocationList,
        };
        const headers = {
            'Content-Type': 'application/json',
        };
        try {
            const result = await axios.post(notifyUrl, playload, {
                headers,
            });
            this.logger.info(
                `notified callback success, params: ${uuid}, status: ${status}, progress: ${progress}, ${JSON.stringify(
                    imageCosLocationList,
                )}, notifyUrl: ${notifyUrl}`,
            );
            return result.data === 'ok';
        } catch (e) {
            this.logger.error(
                `notified callback error, params: ${uuid}, status: ${status}, progress: ${progress}, ${JSON.stringify(
                    imageCosLocationList,
                )}, notifyUrl: ${notifyUrl}, error: ${e.stack}`,
            );
            return false;
        }
    }

    @Cron(CronExpression.EVERY_5_SECONDS, {
        name: 'StableDiffusionGlobalProgressRefresher',
    })
    async refreshSdGlobalProgress() {
        this.logger.info('sd global progress refresher');
        const curretTaskUuid = await this.getCurrentTask();
        if ('' !== curretTaskUuid) {
            const apiUrl = this.configService.get(
                'api.stableDiffusion.progress',
            );
            const headers = {
                'Content-Type': 'application/json',
                Authorization: 'Basic c3FrajplNmVMNVo3NWlHcjY=',
            };
            let percent = 0;
            try {
                const result = await axios.get(apiUrl, { headers });
                const { progress } = result.data;
                percent = Math.floor(progress * 100);
            } catch (e) {
                this.logger.error(
                    `requested sd progress error, error: ${e.stack}`,
                );
            }
            if (percent > 0) {
                await this.notifyCallback(
                    curretTaskUuid,
                    ImagineTaskStatus.PROCESSING,
                    percent,
                );
            }
        }
    }

    async setCurrentTask(uuid: string) {
        await this.cacheManager.set(
            this.currentTaskUuidCacheKey,
            uuid,
            120 * 1000,
        );
    }

    async getCurrentTask(): Promise<string> {
        const uuid = await this.cacheManager.get<string>(
            this.currentTaskUuidCacheKey,
        );
        return undefined === uuid ? '' : uuid;
    }

    async clearCurrentTask() {
        await this.cacheManager.del(this.currentTaskUuidCacheKey);
    }
}
