import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, inlineCode, EmbedBuilder } from "discord.js";
import { BaseCommand } from "./baseCommand";
import { Player, PlayResult } from "../player";
import { AudioFilter } from "../transcoder";

export class PlayCommand extends BaseCommand {
    private static _queryOption = "query";
    private static _modificationOption = "modification";
    private static readonly forcePlayNextOption = "force-play-next";
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("play")
            .setDescription("Plays music from Youtube");
        this.data.addStringOption(option => option
            .setName(PlayCommand._queryOption)
            .setDescription("Search for Youtube music video")
            .setRequired(true)
        );
        this.data.addIntegerOption(option => option
            .setName(PlayCommand._modificationOption)
            .setDescription("Modifies song")
            .addChoices(...[
                AudioFilter.Nightcore,
                AudioFilter.Earrape,
                AudioFilter.Audio8D,
                AudioFilter.Chorus,
                AudioFilter.Chorus2d,
                AudioFilter.Chorus3d
            ].map(filter => ({ name: AudioFilter[filter], value: filter })))
        );
        this.data.addBooleanOption(option => option
            .setName(PlayCommand.forcePlayNextOption)
            .setDescription("Forces to play song as the first in the queue."));
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!await this.joinVoiceChannel(interaction))
            return;

        await interaction.deferReply();

        const query = interaction.options.get(PlayCommand._queryOption, true).value as string;
        const modification = interaction.options.get(PlayCommand._modificationOption)?.value as AudioFilter | undefined;
        const forcePlayNext = interaction.options.get(PlayCommand.forcePlayNextOption)?.value as boolean | undefined;

        const playData = await this._player.play(query, modification ? [modification] : undefined, forcePlayNext);
        const data: PlayResult = playData[0];

        const embed = new EmbedBuilder()
            .setTitle(data.isPlayingNow ? "Now playing" : "Queued")
            .setDescription(inlineCode(data.title))
            .setThumbnail(data.thumbnailUrl)
            .addFields({ name: "Duration", value: data.formattedDuration })

        if (!data.isPlayingNow) {
            const queueEndTime = this._player.getQueueEndTime();

            const date = new Date(0);
            date.setSeconds(queueEndTime! - data.durationInSeconds);
            const queueEndTimeFormatted = date.toISOString().substring(11, 19);

            const date2 = new Date(0);
            date2.setSeconds(queueEndTime!);
            const queueEndTimeFormatted2 = date2.toISOString().substring(11, 19);

            embed.addFields(
                { name: "Time until play", value: queueEndTimeFormatted, inline: true },
                { name: "Time until queue end", value: queueEndTimeFormatted2, inline: true });
        }

        // Temp variable to add last "..." field once.
        let isEndFieldAdded = false;

        // TODO: rework all this embed (also need splitting)
        if (playData.length > 1) {
            playData.forEach((singleVideoPlayData, index) => {
                // Skip first for now as it's handled before.
                if (index == 0)
                    return;

                // Field limit is 25, since there are others, limit to 20 here.
                if (index > 20) {
                    if (!isEndFieldAdded) {
                        embed.addFields({ name: `And ${playData.length - 20} more songs`, value: "..." });
                        isEndFieldAdded = true;
                    }

                    return;
                }

                embed.addFields({ name: `Queued song from playlist ${index}`, value: singleVideoPlayData.title });
            });
        }

        await interaction.editReply({ embeds: [embed] });
    }
}
