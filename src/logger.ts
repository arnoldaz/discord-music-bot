

export class Logger {
    public static log(message: string): void {
        console.log(`[${new Date().toLocaleString()}]: ${message}`);
    }
}
