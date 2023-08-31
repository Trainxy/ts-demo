import { Module } from '@nestjs/common';
import { YoutubeTaskGenerator } from './youtube-task.generator';
import { LegendaryLoggerModule } from '@app/lengendary/logger';
import { YoutubeRepositoryModule } from 'apps/youtube/src/repository';

@Module({
    imports: [LegendaryLoggerModule, YoutubeRepositoryModule],
    providers: [YoutubeTaskGenerator],
})
export class TaskGeneratorModule {}
