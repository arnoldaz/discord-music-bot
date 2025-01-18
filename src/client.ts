import { Client, Collection, Events, GatewayIntentBits, Interaction } from "discord.js";
import { BaseCommand } from "./commands/baseCommand";
import { log, LogLevel } from "./logger";
import { ShutdownCommand } from "./commands/shutdown";

/** Main Discord client class. */
export class DiscordClient {
    /** Internal discord.js client. */
    private _client: Client;

    /** Dictionary of supported commands by command name. */
    private _commandsMap: Collection<string, BaseCommand>;

    /**
     * Creates Discord client and adds interaction listeners.
     * @param commands Supported commands list.
     */
    public constructor(commands: BaseCommand[]) {
        this._client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
        });
        this._commandsMap = commands.reduce(
            (collection, command) => collection.set(command.data.name, command),
            new Collection<string, BaseCommand>()
        );

        this._client.on(Events.ClientReady, () => {
            log("Bot is ready", LogLevel.Info);
        });

        this._client.on(Events.InteractionCreate, async (interaction: Interaction) => {
            if (!interaction.isCommand()) {
                log("Interaction is not a command", LogLevel.Error);
                return;
            }

            const command = this._commandsMap.get(interaction.commandName);
            if (!command) {
                log(`Command "${interaction.commandName}" is not found`, LogLevel.Error);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                const errorString = `Command execution error: ${error}`;
                const callstack = error instanceof Error ? `\n${error.stack}` : "No error callstack found...";
                log(`${errorString} ${callstack}`, LogLevel.Error);

                if (interaction.replied || interaction.deferred)
                    await interaction.followUp({ content: errorString, ephemeral: true });
                else
                    await interaction.reply({ content: errorString, ephemeral: true });
            }

            if (command instanceof ShutdownCommand) {
                log("Shutting down...", LogLevel.Info);
                this._client.destroy();
            }
        });
    }

    /** Starts Discord client. */
    public async run(): Promise<void> {
        const token = process.env.BOT_TOKEN;
        if (!token) {
            log("Bot token is not supplied", LogLevel.Error);
            return;
        }

        await this._client.login(token);
    }
}
