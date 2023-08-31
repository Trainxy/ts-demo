import { Injectable } from '@nestjs/common';
import COS, { PutObjectParams, PutObjectResult } from 'cos-nodejs-sdk-v5';

import { ClientService } from '../services/client.service';
import axios, { AxiosResponse } from 'axios';
import { PassThrough } from 'stream';
import * as fs from 'fs';
import { CosStorageClass } from '../enum';

@Injectable()
export class CosProvider {
    constructor(private readonly clientService: ClientService) {}

    getClient(): COS {
        return this.clientService.getClient();
    }

    async readTextFile(fileKey: string): Promise<string> {
        const cosParams = {
            Bucket: this.clientService.getBucket(),
            Region: this.clientService.getRegion(),
            Key: fileKey,
        };
        const result = await this.getClient().getObject(cosParams);
        return result.Body.toString();
    }

    async readFileToBase64(fileKey: string): Promise<string> {
        const cosParams = {
            Bucket: this.clientService.getBucket(),
            Region: this.clientService.getRegion(),
            Key: fileKey,
        };
        const result = await this.getClient().getObject(cosParams);
        return result.Body.toString('base64');
    }

    async transferRemoteFileToCos(url: string, fileKey): Promise<string> {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
        });
        const buffer = Buffer.from(response.data, 'binary');

        const cosParams: PutObjectParams = {
            Bucket: this.clientService.getBucket(),
            Region: this.clientService.getRegion(),
            Key: fileKey,
            Body: buffer,
            StorageClass: CosStorageClass.STANDARD_IA,
        };

        const result: PutObjectResult = await new Promise((resolve, reject) => {
            this.getClient().putObject(cosParams, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });

        return result.Location;
    }

    async downloadToStream(url: string): Promise<any> {
        return axios.get(url, { responseType: 'stream' });
    }

    uploadFromAxiosStream = (
        fileResponse: AxiosResponse,
        fileKey: string,
    ): {
        passThrough: PassThrough;
        promise: Promise<any>;
    } => {
        const passThrough = new PassThrough();
        const params: PutObjectParams = {
            Bucket: this.clientService.getBucket(),
            Region: this.clientService.getRegion(),
            Key: fileKey,
            ContentType: fileResponse.headers['content-type'],
            ContentLength: +fileResponse.headers['content-length'],
            Body: passThrough,
            StorageClass: CosStorageClass.STANDARD_IA,
        };
        const promise = this.getClient().putObject(params);
        return { passThrough, promise };
    };

    uploadFromStream = (
        fileKey: string,
    ): {
        passThrough: PassThrough;
        promise: Promise<any>;
    } => {
        const passThrough = new PassThrough();
        const params: PutObjectParams = {
            Bucket: this.clientService.getBucket(),
            Region: this.clientService.getRegion(),
            Key: fileKey,
            Body: passThrough,
            StorageClass: CosStorageClass.STANDARD_IA,
        };
        const promise = this.getClient().putObject(params);
        return { passThrough, promise };
    };

    async streamTransferRemoteFileToCos(
        url: string,
        fileKey: string,
    ): Promise<string> {
        const responseStream = await this.downloadToStream(url);

        const { passThrough, promise } = this.uploadFromAxiosStream(
            responseStream,
            fileKey,
        );

        responseStream.data.pipe(passThrough);

        return promise
            .then((result) => {
                return result.Location;
            })
            .catch((e) => {
                throw e;
            });
    }

    async move(fromFileKey: string, toFileKey: string) {
        const cosParams = {
            Bucket: this.clientService.getBucket(),
            Region: this.clientService.getRegion(),
            Key: toFileKey,
            CopySource: `/${this.clientService.getBucket()}/${fromFileKey}`,
        };
        const result = await this.getClient().putObjectCopy(cosParams);
        return result;
    }

    async downloadTo(fileKey, filePath): Promise<boolean> {
        const cosParams = {
            Bucket: this.clientService.getBucket(),
            Region: this.clientService.getRegion(),
            Key: fileKey,
            Output: fs.createWriteStream(filePath),
        };
        const result = await this.getClient().getObject(cosParams);
        return result.statusCode === 200;
    }

    async uploadFileToCos(localFilePath: string, fileKey: string) {
        const cosParams = {
            Bucket: this.clientService.getBucket(),
            Region: this.clientService.getRegion(),
            Key: fileKey,
            Body: fs.readFileSync(localFilePath),
            StorageClass: CosStorageClass.STANDARD_IA,
        };
        const result = await new Promise((res, rej) => {
            this.getClient().putObject(cosParams, (err, data) => {
                if (err) {
                    rej(err);
                } else {
                    res(data);
                }
            });
        });
        return result;
    }

    async uploadBufferToCos(buffer: Buffer, fileKey: string) {
        const cosParams = {
            Bucket: this.clientService.getBucket(),
            Region: this.clientService.getRegion(),
            Key: fileKey,
            Body: buffer,
        };
        const result = await new Promise((res, rej) => {
            this.getClient().putObject(cosParams, (err, data) => {
                if (err) {
                    rej(err);
                } else {
                    res(data);
                }
            });
        });
        return result;
    }

    async getFileInfo(
        fileKey,
    ): Promise<{ contentType: string; contentLength: number }> {
        const cosParams = {
            Bucket: this.clientService.getBucket(),
            Region: this.clientService.getRegion(),
            Key: fileKey,
        };
        const result = await this.getClient().headObject(cosParams);
        return {
            contentType: result.headers['content-type'],
            contentLength: parseInt(result.headers['content-length']),
        };
    }

    async deleteFile(fileKey) {
        const cosParams = {
            Bucket: this.clientService.getBucket(),
            Region: this.clientService.getRegion(),
            Key: fileKey,
        };
        return this.getClient().deleteObject(cosParams);
    }
}
