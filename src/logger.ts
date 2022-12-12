import * as fs from "fs";

export enum LogLevel {
    Error = 1,
    Warning = 2,
    Info = 3,
    None = 100,
}

export class Logger {
    private static readonly logFolderPath = `${process.env.APPDATA}\\DiscordMusicBot`;
    private static readonly logFilePath = `${this.logFolderPath}\\music-bot-server.log`;
    
    private static readonly logLevelString: { [_ in LogLevel]: string } = {
        [LogLevel.Error]: "ERROR",
        [LogLevel.Warning]: "WARN",
        [LogLevel.Info]: "INFO",
        [LogLevel.None]: "NONE",
    };

    private static currentLogLevel = LogLevel.Info;
    private static isInitialized = false;

    private static initializeProcessCallbacks(): void {
        if (this.isInitialized)
            return;

        process.addListener("uncaughtException", (err) => {
            this.log(`Uncaught exception: ${err}\n${err.stack ?? "No stack trace available."}`, LogLevel.Error);
        });

        this.isInitialized = true;
    }

    private static ensureLogFileExists(): void {
        if (!fs.existsSync(this.logFolderPath))
            fs.mkdirSync(this.logFolderPath);

        if (!fs.existsSync(this.logFilePath))
            fs.writeFileSync(this.logFilePath, this.formatLogMessage("Log file created.\n", LogLevel.Info), { flag: "w+" });
    }

    private static get timestamp(): string {
        return new Date().toLocaleString("lt");
    }

    private static formatLogMessage(message: string, logLevel: LogLevel): string {
        return `[${this.timestamp}] ${this.logLevelString[logLevel]}: ${message}`;
    }

    private static log(message: string, logLevel: LogLevel): void {
        this.initializeProcessCallbacks();
        this.ensureLogFileExists();
        const formattedMessage = this.formatLogMessage(message, logLevel);

        console.log(formattedMessage);
        fs.appendFileSync(this.logFilePath, `${formattedMessage}\n`);
    }

    public static setLogLevel(logLevel: LogLevel): void {
        this.currentLogLevel = logLevel;
    }

    public static logInfo(message: string): void {
        if (this.currentLogLevel <= LogLevel.Info)
            this.log(message, LogLevel.Info);
    }

    public static logWarning(message: string): void {
        if (this.currentLogLevel <= LogLevel.Warning)
            this.log(message, LogLevel.Warning);
    }

    public static logError(message: string): void {
        if (this.currentLogLevel <= LogLevel.Error)
            this.log(message, LogLevel.Error);
    }
}
