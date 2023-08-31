import { NestFactory } from '@nestjs/core';
import { AiArtModule } from './ai-art.module';

async function bootstrap() {
    const app = await NestFactory.create(AiArtModule);
    await app.listen(8003);
}
bootstrap();
