export class Logger {
    private static get timestamp(): string {
        return `[${new Date().toLocaleString("lt")}]`;
    }

    private static log(logLevel: string, message: string): void {
        console.log(`${this.timestamp} ${logLevel}: ${message}`);
    }

    public static logInfo(message: string): void {
        this.log("INFO", message);
    }

    public static logError(message: string): void {
        this.log("ERROR", message);
    }
}
