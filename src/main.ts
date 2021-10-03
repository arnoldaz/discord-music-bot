import dotenv from "dotenv";
import { Logger } from "./logger";
import { DiscordClient } from "./client";
import { BaseCommand } from "./commands/baseCommand";
import { PlayCommand } from "./commands/play";
import { registerCommands } from "./register";
import { YoutubeDownloader } from "./youtubeDownloader";
import { Player } from "./player";
import { LeaveCommand } from "./commands/leave";
import { QueueCommand } from "./commands/queue";
import { SkipCommand } from "./commands/skip";

dotenv.config();

(async () => {
    const downloader = new YoutubeDownloader();
    const player = new Player(downloader);

    const supportedCommands: BaseCommand[] = [
        new PlayCommand(player),
        new LeaveCommand(player),
        new QueueCommand(player),
        new SkipCommand(player),
    ];

    if (process.argv.slice(2).some(arg => arg.includes("register"))) {
        await registerCommands(supportedCommands);
        return;
    }

    const discordClient = new DiscordClient(supportedCommands);
    discordClient.run().catch(error => Logger.log(error));
})();

