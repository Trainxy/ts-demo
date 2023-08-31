export class TaskNotFound extends Error {
    constructor(msg?: string) {
        super(msg);
        this.name = 'TaskNotFound';
    }
}
