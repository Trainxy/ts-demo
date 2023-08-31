export class NoPaidAccountAvailable extends Error {
    constructor(msg?: string) {
        super(msg);
        this.name = 'NoPaidAccountAvailable';
    }
}
