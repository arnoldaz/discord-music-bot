import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { BaseCommand } from "./baseCommand";
import { Player } from "../player";

export class SeekCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("seek")
            .setDescription("Seeks");
        this.data.addIntegerOption(option => option
            .setName("seconds")
            .setDescription("Seek to that second")
            .setRequired(true)
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const seconds = interaction.options.getInteger("seconds")!;
        this._player.seek(seconds);
        await interaction.editReply(`Seeked to ${seconds} seconds.`);
    }
}
