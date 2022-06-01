import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { AudioType, Player } from "../player";
import { CommandInteraction, Formatters } from "discord.js";

export class RemoveCommand extends BaseCommand {
    private static _idOption = "id";
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("remove")
            .setDescription("Removes song from queue.");
        this.data.addIntegerOption(option => option
            .setName(RemoveCommand._idOption)
            .setDescription("Id of song to remove from queue.")
            .setRequired(true)
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const id = interaction.options.getInteger(RemoveCommand._idOption)!;

        const removedAudio = this._player.removeSong(id);
        if (!removedAudio) {
            await interaction.editReply(`Nothing was removed.`);
            return;
        }

        const title = removedAudio.type == AudioType.Radio
            ? Player.radioStationNames[removedAudio.radioStation]
            : removedAudio.title;

        await interaction.editReply(
            `Queue item with ID ${Formatters.inlineCode(id.toString())} and title ${Formatters.inlineCode(title)} removed.`
        );
    }
}
