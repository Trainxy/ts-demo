import { Global, Module } from '@nestjs/common';
import { FfmpegService } from './ffmpeg.service';

@Global()
@Module({
    imports: [],
    providers: [FfmpegService],
    exports: [FfmpegService],
})
export class FfmpegModule {}
