export class ReferenceTaskNotFound extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = 'ReferenceTaskNotFound';
    }
}
