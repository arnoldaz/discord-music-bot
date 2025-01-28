import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { AudioType, Player } from "../player";
import { CommandInteraction, EmbedBuilder, inlineCode } from "discord.js";
import { convertToTimeString } from "../timeFormat";
import { AudioFilter } from "../transcoder";

/**
 * Command to display currently playing song.
 */
export class NowPlayingCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("np")
            .setDescription("Displays currently playing song");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const data = this._player.currentlyPlaying;
        const currentTime = this._player.currentTimer;

        if (!data || !currentTime) {
            await interaction.editReply("Nothing is currently playing.");
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("Now playing")
            .setDescription(inlineCode(data.title))
            .addFields({ name: "Duration", value: convertToTimeString(currentTime, true) + " / " + convertToTimeString(data.duration, true) });

        if (data.type == AudioType.Song)
            embed.setThumbnail(data.thumbnailUrl);

        if (data.transcodeOptions.filters && data.transcodeOptions.filters.length > 0) {
            for (const modification in data.transcodeOptions.filters) {
                embed.addFields({ name: "Modification", value: AudioFilter[modification], inline: true });
            }
        }

        if (data.transcodeOptions.volume !== undefined)
            embed.addFields({ name: "Volume", value: data.transcodeOptions.volume.toString(), inline: true });

        await interaction.editReply({ embeds: [embed] });
    }
}
