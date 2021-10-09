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
import { ClearCommand } from "./commands/clear";
import { NowPlayingCommand } from "./commands/nowPlaying";
import { RemoveCommand } from "./commands/remove";
import { ShuffleCommand } from "./commands/shuffle";

dotenv.config();

(async () => {
    const downloader = new YoutubeDownloader();
    const player = new Player(downloader);

    const supportedCommands: BaseCommand[] = [
        new PlayCommand(player),
        new LeaveCommand(player),
        new QueueCommand(player),
        new SkipCommand(player),
        new ClearCommand(player),
        new NowPlayingCommand(player),
        new RemoveCommand(player),
        new ShuffleCommand(player),
    ];

    if (process.argv.slice(2).some(arg => arg.includes("register"))) {
        await registerCommands(supportedCommands);
        return;
    }

    const discordClient = new DiscordClient(supportedCommands);
    discordClient.run().catch(error => Logger.logInfo(error));
})();

