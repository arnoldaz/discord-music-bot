import { Client, Collection, Intents, Interaction } from "discord.js";
import { BaseCommand } from "./commands/baseCommand";
import { Logger } from "./logger";

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
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
        });
        this._commandsMap = commands.reduce(
            (collection, command) => collection.set(command.data.name, command),
            new Collection<string, BaseCommand>()
        );

        this._client.on("ready", () => {
            Logger.logInfo("Bot is ready.");
        });

        this._client.on("interactionCreate", async (interaction: Interaction) => {
            if (!interaction.isCommand()) {
                Logger.logError("Interaction is not a command.");
                return;
            }

            const command = this._commandsMap.get(interaction.commandName);
            if (!command) {
                Logger.logError(`Command "${interaction.commandName}" is not found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                const errorString = `Command execution error: ${error}.`;
                const callstack = error instanceof Error ? `\n${error.stack}` : "No error callstack found.";
                Logger.logError(`${errorString} ${callstack}`);

                if (interaction.replied || interaction.deferred)
                    await interaction.followUp({ content: errorString, ephemeral: true });
                else await interaction.reply({ content: errorString, ephemeral: true });
            }
        });
    }

    /** Starts Discord client. */
    public async run(): Promise<void> {
        const token = process.env.BOT_TOKEN;
        if (!token) {
            Logger.logError("Bot token is not supplied.");
            return;
        }

        await this._client.login(token);
    }
}
