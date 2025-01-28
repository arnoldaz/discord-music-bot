import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand } from "./baseCommand";
import { Player } from "../player";

/**
 * Command to shutdown the bot.
 * @remarks Shutdown itself can't happen from inside the command, it is done in the main runtime loop based on command class type.
 */
export class ShutdownCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("shutdown")
            .setDescription("Clears everything and shutdowns bot");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        this._player.clearQueue();
        this._player.skip();
        this._player.disconnect();
        await interaction.editReply("Shutting down...");
    }
}
