import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand } from "./baseCommand";
import { Player } from "../player";

/**
 * Command to clear current player queue.
 */
export class ClearCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("clear")
            .setDescription("Clears current queue");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        this._player.clearQueue();
        await interaction.editReply("Queue cleared.");
    }
}
