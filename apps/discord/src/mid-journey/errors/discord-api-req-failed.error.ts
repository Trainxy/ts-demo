export class DiscordApiReqFailed extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = 'DiscordApiReqFailed';
    }
}
