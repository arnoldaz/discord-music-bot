import { log, LogLevel } from "../logger";

/** Seconds type for easier readability. */
export type Seconds = number;

/** Simple class for calculating duration or execution time. */
export class Timer {
    private _startTime = BigInt(0);
    private _isStarted = false;

    /** Starts execution timer. */
    public startTimer(): void {
        if (this._isStarted) {
            log("Timer programmer error: Timer is already started", LogLevel.Error);
            return;
        }

        this._startTime = process.hrtime.bigint();
        this._isStarted = true;
    }

    /**
     * Gets current execution time.
     * @returns Execution time in seconds.
     */
    public getTime(): Seconds {
        if (!this._isStarted) {
            log("Timer programmer error: Timer is not started", LogLevel.Error);
            return -1;
        }

        const endTime = process.hrtime.bigint();
        const nanoSecondsPassed = endTime - this._startTime;
        return Number(nanoSecondsPassed / BigInt(1e9));
    }

    /** Ends and resets previously started timer. */
    public endTimer(): void {
        this._startTime = BigInt(0);
        this._isStarted = false;
    }
}