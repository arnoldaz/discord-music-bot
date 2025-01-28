import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction, inlineCode } from "discord.js";

/**
 * Command to remove specific song from the queue.
 */
export class RemoveCommand extends BaseCommand {
    public data: SlashCommandBuilder;
    private static readonly idOption = "id";

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("remove")
            .setDescription("Removes song from queue");
        this.data.addIntegerOption(option => option
            .setName(RemoveCommand.idOption)
            .setDescription("Id of song to remove from queue (1 is next song in the queue)")
            .setRequired(true)
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const id = interaction.options.get(RemoveCommand.idOption, true).value as number;

        const removedAudio = this._player.removeSong(id);
        if (!removedAudio) {
            await interaction.editReply(`Nothing was removed.`);
            return;
        }

        await interaction.editReply(
            `Queue item with ID ${inlineCode(id.toString())} and title ${inlineCode(removedAudio.title)} removed.`
        );
    }
}
