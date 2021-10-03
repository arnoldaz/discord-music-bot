import dotenv from "dotenv";
import { Logger } from "./logger";
import { DiscordClient } from "./client";
import { BaseCommand } from "./commands/baseCommand";
import { PlayCommand } from "./commands/play";
import { registerCommands } from "./register";
import { YoutubeDownloader } from "./youtubeDownloader";
import { Player } from "./player";

dotenv.config();

(async () => {
    const downloader = new YoutubeDownloader();
    const player = new Player(downloader);

    const supportedCommands: BaseCommand[] = [
        new PlayCommand(player),
    ];

    if (process.argv.slice(2).some(arg => arg.includes("register"))) {
        await registerCommands(supportedCommands);
        return;
    }

    const discordClient = new DiscordClient(supportedCommands);
    discordClient.run().catch(error => Logger.log(error));
})();

