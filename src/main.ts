import dotenv from "dotenv";
import { log, LogLevel, initializeLogger } from "./logger";
import { DiscordClient } from "./client";
import { Player } from "./player";
import { registerCommands } from "./register";

import { SeekCommand } from "./commands/seek";
import { PauseCommand } from "./commands/pause";
import { ResumeCommand } from "./commands/resume";
import { BaseCommand } from "./commands/baseCommand";
import { ClearCommand } from "./commands/clear";
import { JoinCommand } from "./commands/join";
import { LeaveCommand } from "./commands/leave";
import { NowPlayingCommand } from "./commands/nowPlaying";
import { PlayCommand } from "./commands/play";
import { PlayCustomCommand } from "./commands/playCustom";
import { QueueCommand } from "./commands/queue";
import { RadioCommand } from "./commands/radio";
import { RemoveCommand } from "./commands/remove";
import { ShuffleCommand } from "./commands/shuffle";
import { SkipCommand } from "./commands/skip";
import { ShutdownCommand } from "./commands/shutdown";

dotenv.config();

(async () => {
    initializeLogger();
    log(`${"=".repeat(25)} Starting Discord Music bot ${"=".repeat(25)}`, LogLevel.Info);
    
    const player = new Player();
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
        new SeekCommand(player),
        new PlayCustomCommand(player),
        new PauseCommand(player),
        new ResumeCommand(player),
        new ShutdownCommand(player),
    ];

    if (process.argv.slice(2).some(arg => arg.includes("register"))) {
        await registerCommands(supportedCommands);
        return;
    }

    const discordClient = new DiscordClient(supportedCommands);
    discordClient.run().catch(error => log(error, LogLevel.Error));
})();
