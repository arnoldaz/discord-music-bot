import dotenv from "dotenv";
import { log, LogLevel, initializeLogger } from "./logger";
import { DiscordClient } from "./client";
import { Player } from "./player";
import { registerCommands } from "./register";
import { Transcoder } from "./transcoder";
import {
    BaseCommand,
    ClearCommand,
    JoinCommand,
    LeaveCommand,
    LyricsCommand,
    NowPlayingCommand,
    PlayCommand,
    QueueCommand,
    RadioCommand,
    RemoveCommand,
    ShuffleCommand,
    SkipCommand,
    PlayCustomCommand
} from "./commands";
import { SeekCommand } from "./commands/seek";
import { PauseCommand } from "./commands/pause";
import { ResumeCommand } from "./commands/resume";

dotenv.config();

(async () => {
    initializeLogger();
    log(`${"=".repeat(25)} Starting Discord Music bot ${"=".repeat(25)}`, LogLevel.Info);
    
    const transcoder = new Transcoder();
    const player = new Player(transcoder);

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
        new LyricsCommand(player),
        new SeekCommand(player),
        new PlayCustomCommand(player),
        new PauseCommand(player),
        new ResumeCommand(player),
    ];

    if (process.argv.slice(2).some(arg => arg.includes("register"))) {
        await registerCommands(supportedCommands);
        return;
    }

    const discordClient = new DiscordClient(supportedCommands);
    discordClient.run().catch(error => log(error, LogLevel.Error));
})();
