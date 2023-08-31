import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    async set(key: string, value: unknown, ttl = 0): Promise<void> {
        try {
            await this.cacheManager.set(key, value, ttl);
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    async get(key: string): Promise<unknown> {
        try {
            return await this.cacheManager.get(key);
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }
}
