import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, inlineCode, EmbedBuilder, MessageFlags } from "discord.js";
import { BaseCommand } from "./baseCommand";
import { Player } from "../player";
import { AudioFilter } from "../transcoder";
import { convertToTimeString } from "../timeFormat";

/**
 * Command to play or queue YouTube video (or playlist) either by direct link or search query.
 */
export class PlayCommand extends BaseCommand {
    public data: SlashCommandBuilder;
    private static readonly queryOption = "query";
    private static readonly modificationOption = "modification";
    private static readonly forcePlayNextOption = "force_play_next";
    private static readonly volumeOption = "volume";
    private static readonly invisibleOption = "invisible";

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("play")
            .setDescription("Plays music from Youtube");
        this.data.addStringOption(option => option
            .setName(PlayCommand.queryOption)
            .setDescription("Search for Youtube music video")
            .setRequired(true)
        );
        this.data.addIntegerOption(option => option
            .setName(PlayCommand.modificationOption)
            .setDescription("Modifies song")
            .addChoices(...[
                AudioFilter.Nightcore,
                AudioFilter.Earrape,
                AudioFilter.Audio8D,
                AudioFilter.Chorus,
                AudioFilter.Chorus2d,
                AudioFilter.Chorus3d
            ].map(filter => ({ name: AudioFilter[filter], value: filter }))));
        this.data.addBooleanOption(option => option
            .setName(PlayCommand.forcePlayNextOption)
            .setDescription("Forces to play song as the first in the queue"));
        this.data.addIntegerOption(option => option
            .setName(PlayCommand.volumeOption)
            .setDescription("Modifies the volume of the song (default is 100)"));
        this.data.addBooleanOption(option => option
            .setName(PlayCommand.invisibleOption)
            .setDescription("Makes the bot reply with the song data invisible to other users"));
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!await this.joinVoiceChannel(interaction))
            return;

        const query = interaction.options.get(PlayCommand.queryOption, true).value as string;
        const modification = interaction.options.get(PlayCommand.modificationOption)?.value as AudioFilter | undefined;
        const forcePlayNext = interaction.options.get(PlayCommand.forcePlayNextOption)?.value as boolean | undefined;
        const volume = interaction.options.get(PlayCommand.volumeOption)?.value as number | undefined;
        const invisible = interaction.options.get(PlayCommand.invisibleOption)?.value as boolean | undefined;
        
        await interaction.deferReply(invisible ? { flags: MessageFlags.Ephemeral } : {});

        const playResult = await this._player.playQuery(
            query,
            modification !== undefined ? [modification] : undefined,
            forcePlayNext,
            volume,
        );
        const firstSong = playResult[0];

        const embed = new EmbedBuilder()
            .setTitle(firstSong.isPlayingNow ? "Now playing" : "Queued")
            .setDescription(inlineCode(firstSong.title))
            .setThumbnail(firstSong.thumbnailUrl)
            .addFields({ name: "Duration", value: convertToTimeString(firstSong.duration, true) });

        if (!firstSong.isPlayingNow) {
            const queueEndTime = this._player.getQueueEndTime() ?? 0;
            const timeUntilPlay = forcePlayNext
                ? this._player.getCurrentlyPlayingEndTime() ?? 0
                : queueEndTime - firstSong.duration

            embed.addFields(
                { name: "Time until play", value: convertToTimeString(timeUntilPlay, true), inline: true },
                { name: "Time until queue end", value: convertToTimeString(queueEndTime, true), inline: true }
            );
        }

        if (modification !== undefined || forcePlayNext !== undefined || volume !== undefined || invisible !== undefined) {
            let options = "";
            if (modification !== undefined)
                options += `Modification: ${inlineCode(AudioFilter[modification])}\n`;
            
            if (forcePlayNext !== undefined && forcePlayNext)
                options += "Force play next\n";
            
            if (volume !== undefined)
                options += `Volume: ${inlineCode(volume.toString())}\n`;
    
            if (invisible !== undefined && invisible)
                options += "Invisible\n";

            embed.addFields({ name: "Additional options", value: options });
        }

        if (playResult.length > 1) {
            const totalDuration = playResult.reduce((totalTime, song) => totalTime + song.duration, 0);
            embed.addFields({ name: "Total playlist duration", value: convertToTimeString(totalDuration, true) });

            const maxQueueFields = 15;
            for (const [i, value] of playResult.entries()) {
                if (i == 0)
                    continue;

                if (i > maxQueueFields) {
                    embed.addFields({ name: `And ${playResult.length - maxQueueFields} more songs`, value: "..." });
                    break;
                }

                embed.addFields({ name: `Queued song from playlist ${i}`, value: value.title });
            }
        }

        await interaction.editReply({ embeds: [embed] });
    }
}
