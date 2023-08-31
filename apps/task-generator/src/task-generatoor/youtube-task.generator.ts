import { Exchange, RoutingKey } from '@app/lengendary/common/enum/messaging';
import { TaskLogger } from '@app/lengendary/logger/providers';
import { MessagingService } from '@app/lengendary/messaging';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { YoutubeRepository } from 'apps/youtube/src/repository';

@Injectable()
export class YoutubeTaskGenerator {
    constructor(
        private readonly logger: TaskLogger,
        private readonly messagingService: MessagingService,
        private readonly youtubeRepository: YoutubeRepository,
    ) {}

    @Cron('0 */10 * * * *')
    // @Cron('0 0 */2 * * *')
    async generateSyncTask() {
        // const waitingSyncVideos =
        //     await this.youtubeRepository.getWaitingSyncVideosAndMarkQueuing(
        //         100,
        //     );
        const waitingSyncVideos =
            await this.youtubeRepository.getCategoryWaitingSyncVideosAndMarkQueuing(
                [53, 54, 55, 56],
                100,
            );

        await Promise.all(
            waitingSyncVideos.map((video) => {
                return this.messagingService.send(
                    Exchange.DEFAULT,
                    RoutingKey.NEW_YOUTUBE_SYNC_TASK,
                    {
                        id: video.id,
                        videoId: video.videoId,
                    },
                );
            }),
        );

        this.logger.info(
            '[TaskGenerator] generate sync task, total: ' +
                waitingSyncVideos.length,
        );
    }

    @Cron('0 */5 * * * *')
    async generatePreprocessTask() {
        const waitingPreprocessVideos =
            await this.youtubeRepository.getWaitingPreprocessVideosAndMarkQueuing(
                100,
            );

        await Promise.all(
            waitingPreprocessVideos.map((video) => {
                return this.messagingService.send(
                    Exchange.DEFAULT,
                    RoutingKey.NEW_YOUTUBE_PREPROCESS_TASK,
                    {
                        id: video.id,
                        videoId: video.videoId,
                    },
                );
            }),
        );

        this.logger.info(
            '[TaskGenerator] generate preprocess task, total: ' +
                waitingPreprocessVideos.length,
        );
    }

    @Cron('0 */2 * * * *')
    async generateScrapeTask() {
        const waitingScrapeAuthors =
            await this.youtubeRepository.getWaitingAuthorsAndMarkQueuing();

        await Promise.all(
            waitingScrapeAuthors.map((author) => {
                return this.messagingService.send(
                    Exchange.DEFAULT,
                    RoutingKey.NEW_YOUTUBE_SCRAPE_TASK,
                    {
                        id: author.id,
                        userName: author.userName,
                    },
                );
            }),
        );

        this.logger.info(
            '[TaskGenerator] generate author scrape task, total: ' +
                waitingScrapeAuthors.length,
        );
    }

    @Cron('0 */2 * * * *')
    async generatePlaylistScrapeTask() {
        const waitingScrapePlaylists =
            await this.youtubeRepository.getWaitingPlaylistsAndMarkQueuing();

        await Promise.all(
            waitingScrapePlaylists.map((playlist) => {
                return this.messagingService.send(
                    Exchange.DEFAULT,
                    RoutingKey.NEW_YOUTUBE_PLAYLIST_SCRAPE_TASK,
                    {
                        id: playlist.id,
                        playlistId: playlist.playlistId,
                    },
                );
            }),
        );

        this.logger.info(
            '[TaskGenerator] generate playlist scrape task, total: ' +
                waitingScrapePlaylists.length,
        );
    }
}
