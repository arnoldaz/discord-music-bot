import * as fs from "fs";

export enum LogLevel {
    Error = 1,
    Warning = 2,
    Info = 3,
    Debug = 4,
    None = 100,
}

/**
 * Logs message to console and log file if log level passes global log level check.
 * @param message Message to log.
 * @param level Log level.
 */
export function log(message: string, level: LogLevel): void {
    if (GLOBAL_LOG_LEVEL < level)
        return

    const formattedMessage = formatLogMessage(message, level);
    console.log(`${LOG_LEVEL_COLOR[level]}${formattedMessage}${LogColor.Reset}`);
    fs.appendFileSync(LOG_FILE_PATH, `${formattedMessage}\n`);
}

export function initializeLogger(): void {
    if (!fs.existsSync(LOG_FOLDER_PATH))
        fs.mkdirSync(LOG_FOLDER_PATH);

    if (!fs.existsSync(LOG_FILE_PATH))
        fs.writeFileSync(LOG_FILE_PATH, formatLogMessage("Log file created.\n", LogLevel.Info), { flag: "w+" });

    // Allow logging process crash exceptions for better debugging
    process.addListener("uncaughtException", (err) => {
        log(`Uncaught exception: ${err}\n${err.stack ?? "No stack trace available."}`, LogLevel.Error);
    });
}

const GLOBAL_LOG_LEVEL = LogLevel.Debug;

const LOG_FOLDER_PATH = `${process.env.APPDATA}\\DiscordMusicBot`;
const LOG_FILE_PATH = `${LOG_FOLDER_PATH}\\music-bot-server.log`;

enum LogColor {
    None = "",
    Reset = "\x1b[0m",
    Red = "\x1b[31m",
    Yellow = "\x1b[33m",
    Gray = "\x1b[90m",
}

const LOG_LEVEL_PREFIX: Record<LogLevel, string> = {
    [LogLevel.Error]: "ERROR",
    [LogLevel.Warning]: "WARN",
    [LogLevel.Info]: "INFO",
    [LogLevel.Debug]: "DEBUG",
    [LogLevel.None]: "NONE",
};

const LOG_LEVEL_COLOR: Record<LogLevel, LogColor> = {
    [LogLevel.Error]: LogColor.Red,
    [LogLevel.Warning]: LogColor.Yellow,
    [LogLevel.Info]: LogColor.None,
    [LogLevel.Debug]: LogColor.Gray,
    [LogLevel.None]: LogColor.None,
};

function formatLogMessage(message: string, level: LogLevel): string {
    return `[${new Date().toLocaleString("lt")}] ${LOG_LEVEL_PREFIX[level]}: ${message}`;
}
