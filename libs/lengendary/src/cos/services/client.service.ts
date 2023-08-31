import { Inject, Injectable } from '@nestjs/common';
import { COS_MODULE_OPTIONS } from '../constants/cos-module.constant';
import { CosModuleOption } from '../interfaces';
import COS from 'cos-nodejs-sdk-v5';

@Injectable()
export class ClientService {
    private readonly config: CosModuleOption;
    private client: COS;

    constructor(@Inject(COS_MODULE_OPTIONS) config: CosModuleOption) {
        this.config = config;
    }

    getClient(): COS {
        if (this.client === undefined) {
            this.client = new COS({
                SecretId: this.config.secretId,
                SecretKey: this.config.secretKey,
                UseAccelerate: this.config.useAccelerate,
            });
        }
        return this.client;
    }

    getBucket(): string {
        return this.config.bucket;
    }

    getRegion(): string {
        return this.config.region;
    }
}
