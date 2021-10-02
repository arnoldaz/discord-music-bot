import dotenv from "dotenv";
import { Logger } from "./logger";
import { DiscordClient } from "./client";
import { BaseCommand } from "./commands/baseCommand";
import { PlayCommand } from "./commands/play";
import { registerCommands } from "./register";
import { YoutubeDownloader } from "./youtubeDownloader";

dotenv.config();

(async () => {
    const logger = new Logger();
    const downloader = new YoutubeDownloader();

    const supportedCommands: BaseCommand[] = [
        new PlayCommand(downloader),
    ];

    if (process.argv.slice(2).some(arg => arg.includes("register"))) {
        await registerCommands(supportedCommands);
        return;
    }

    const discordClient = new DiscordClient(supportedCommands);
    discordClient.run().catch(error => Logger.log(error));
})();

