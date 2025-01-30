import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, inlineCode } from "discord.js";
import { BaseCommand } from "./baseCommand";
import { Player } from "../player";
import { convertToSeconds } from "../timeFormat";

/**
 * Command to seek the currently playing song to specific time.
 */
export class SeekCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("seek")
            .setDescription("Seeks");
        this.data.addStringOption(option => option
            .setName("time")
            .setDescription("Seeks to that time")
            .setRequired(true)
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const time = interaction.options.get("time", true).value as string;
        const seconds = convertToSeconds(time);

        if (seconds === undefined) {
            await interaction.editReply("Can't seek to invalid time string.");
            return;
        }

        this._player.seek(seconds);
        await interaction.editReply(`Seeking to ${inlineCode(time)} (${seconds} seconds).`);
    }
}
