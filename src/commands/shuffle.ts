import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand } from "./baseCommand";
import { Player } from "../player";

/**
 * Command to shuffle the current queue.
 */
export class ShuffleCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("shuffle")
            .setDescription("Shuffles queue");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        this._player.shuffleQueue();
        await interaction.editReply("Queue shuffled.");
    }
}
