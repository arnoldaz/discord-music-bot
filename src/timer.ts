import { log, LogLevel } from "./logger";

/** Seconds type for easier readability. */
export type Seconds = number;

/**
 * Simple class for counting time.
 */
export class Timer {
    private _startTime = BigInt(0);
    private _isStarted = false;

    private _pauseTime = BigInt(0);
    private _isPaused = false;
    private _pausedElapsedTime = BigInt(0);

    /**
     * Starts execution timer.
     */
    public start(): void {
        if (this._isStarted) {
            log("Timer is already started", LogLevel.Info);
            return;
        }

        this._startTime = process.hrtime.bigint();
        this._isStarted = true;
        this._isPaused = false;
        this._pausedElapsedTime = BigInt(0);
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

        const endTime = this._isPaused
            ? this._pauseTime
            : process.hrtime.bigint()

        const nanoSecondsPassed = endTime - this._startTime - this._pausedElapsedTime;
        return Number(nanoSecondsPassed / BigInt(1e9));
    }

    /** Ends and resets previously started timer. */
    public end(): void {
        if (!this._isStarted) {
            log("Timer programmer error: Timer is not started", LogLevel.Error);
            return;
        }

        this._startTime = BigInt(0);
        this._isStarted = false;
    }

    public set(time: Seconds): void {
        this._startTime = BigInt(time * 1e9);
        this._isStarted = true;
    }

    public pause(): void {
        if (this._isPaused) {
            log("Timer programmer error: Timer is already paused", LogLevel.Error);
            return;
        }

        this._pauseTime = process.hrtime.bigint();
        this._isPaused = true;
    }
    
    public resume(): void {
        if (!this._isPaused) {
            log("Timer programmer error: Timer is not paused", LogLevel.Error);
            return;
        }
        
        const resumeTime = process.hrtime.bigint();
        this._isPaused = false;
        this._pausedElapsedTime += resumeTime - this._pauseTime;
    }
}