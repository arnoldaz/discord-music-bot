import { Client, Collection, Intents, Interaction } from "discord.js";
import { BaseCommand } from "./commands/baseCommand";
import { Logger } from "./logger";

export class DiscordClient{
    private _client: Client;
    private _commandsMap: Collection<string, BaseCommand>;

    public constructor(commands: BaseCommand[]) {
        this._client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ] });
        this._commandsMap = commands.reduce(
            (collection: Collection<string, BaseCommand>, command: BaseCommand) => 
                collection.set(command.data.name, command), 
                new Collection<string, BaseCommand>()
        );

        this._client.on("ready", () => {
            Logger.log("Bot is ready.");
        });

        this._client.on("interactionCreate", async (interaction: Interaction) => {
            if (!interaction.isCommand()) 
                return;
        
            const command = this._commandsMap.get(interaction.commandName);
            if (!command) 
                return;
        
            try {
                await command.execute(interaction);
            } catch (error) {
                Logger.log(`Command execution error: ${error}`);
                await interaction.reply({ content: "Command execution error", ephemeral: true });
            }
        });
    }

    public async run(): Promise<string> {
        return this._client.login(process.env.BOT_TOKEN);
    }
}