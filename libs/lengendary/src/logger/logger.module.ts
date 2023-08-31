import { Module } from '@nestjs/common';
import {
    AiArtLogger,
    DebugLogger,
    HttpLogger,
    TaskLogger,
    TuiwenLogger,
    YoutubeLogger,
} from './providers';

@Module({
    providers: [
        HttpLogger,
        TaskLogger,
        DebugLogger,
        YoutubeLogger,
        TuiwenLogger,
        AiArtLogger,
    ],
    exports: [
        HttpLogger,
        TaskLogger,
        DebugLogger,
        YoutubeLogger,
        TuiwenLogger,
        AiArtLogger,
    ],
})
export class LegendaryLoggerModule {}
