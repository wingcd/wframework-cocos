export class TimeWatcher {
    private _startTime: number = 0;
    private _endTime: number = 0;
    private _isRunning: boolean = false;

    public start(): void {
        this._startTime = Date.now();
        this._isRunning = true;
    }

    public stop(): void {
        this._endTime = Date.now();
        this._isRunning = false;
    }

    public getElapsedTime(): number {
        return this._endTime - this._startTime;
    }

    public getElapsedTimeNow(): number {
        return Date.now() - this._startTime;
    }

    public isRunning(): boolean {
        return this._isRunning;
    }

    public printElapsedTime(pattern: string): void {
        console.log(pattern.replace("%s", this.getElapsedTimeNow().toString()));
    }
}