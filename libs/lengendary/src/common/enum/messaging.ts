export enum Exchange {
    DEFAULT = 'legendary-exchange',
}

export enum Queue {
    DEMO = 'demo-queue',
    OPENAI_TASK = 'openai-task-queue',
    YOUTUBE_SCRAPE_TASK = 'youtube-scrape-task-queue',
    YOUTUBE_PLAYLIST_SCRAPE_TASK = 'youtube-playlist-scrape-task-queue',
    YOUTUBE_SYNC_TASK = 'youtube-sync-task-queue',
    YOUTUBE_PREPROCESS_TASK = 'youtube-preprocess-task-queue',
    DISCORD_MJ_FREE_TASK = 'discord-mj-free-queue',
    DISCORD_MJ_PREMIUM_TASK = 'discord-mj-premium-queue',
    TUIWEN_TASK = 'tuiwen-task-queue',
    STOCK_TASK = 'stock-task-queue',
    QIDIANYUN_TASK = 'qidianyun-task-queue',
    VIDEO_PREPROCESS_TASK = 'video-preprocess-task-queue',
    VIDEO_PREPROCESS_GENERATE_TASK = 'video-preprocess-generate-task-queue',
    AI_ART_TASK = 'ai-art-task-queue',
}

export enum RoutingKey {
    DEMO = 'demo-route',
    NEW_OPENAI_TASK = 'new-openai-task',
    NEW_YOUTUBE_SCRAPE_TASK = 'new-youtube-scrape-task',
    NEW_YOUTUBE_PLAYLIST_SCRAPE_TASK = 'new-youtube-playlist-scrape-task',
    NEW_YOUTUBE_SYNC_TASK = 'new-youtube-sync-task',
    NEW_YOUTUBE_PREPROCESS_TASK = 'new-youtube-preprocess-task',
    NEW_DISCORD_MJ_FREE_TASK = 'new-discord-mj-free-task',
    NEW_DISCORD_MJ_PREMIUM_TASK = 'new-discord-mj-premium-task',
    NEW_TUIWEN_TASK = 'new-tuiwen-task',
    NEW_STOCK_TASK = 'new-stock-task',
    NEW_QIDIANYUN_TASK = 'new-qidianyun-task',
    NEW_VIDEO_PREPROCESS_TASK = 'new-video-preprocess-task',
    NEW_VIDEO_PREPROCESS_GENERATE_TASK = 'new-video-preprocess-generate-task',
    NEW_AI_ART_TASK = 'new-ai-art-task',
}

export enum Channel {
    DEFAULT = 'channel-1',
}
