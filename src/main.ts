import dotenv from "dotenv";
import { Logger } from "./logger";
import { DiscordClient } from "./client";
import { Player } from "./player";
import { registerCommands } from "./register";
import { YoutubeDownloader } from "./youtubeDownloader";
import { Transcoder } from "./transcoder";
import { BaseCommand, ClearCommand, JoinCommand, LeaveCommand, NowPlayingCommand, PlayCommand, QueueCommand, RadioCommand, RemoveCommand, ShuffleCommand, SkipCommand } from "./commands";

dotenv.config();

(async () => {
    const downloader = new YoutubeDownloader();
    const transcoder = new Transcoder();
    const player = new Player(downloader, transcoder);

    const supportedCommands: BaseCommand[] = [
        new PlayCommand(player),
        new LeaveCommand(player),
        new QueueCommand(player),
        new SkipCommand(player),
        new ClearCommand(player),
        new NowPlayingCommand(player),
        new RemoveCommand(player),
        new ShuffleCommand(player),
        new RadioCommand(player),
        new JoinCommand(player),
    ];

    if (process.argv.slice(2).some(arg => arg.includes("register"))) {
        await registerCommands(supportedCommands);
        return;
    }

    const discordClient = new DiscordClient(supportedCommands);
    discordClient.run().catch(error => Logger.logError(error));
})();

