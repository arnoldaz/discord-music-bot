import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Formatters, MessageEmbed } from "discord.js";
import { BaseCommand } from "./baseCommand";
import { Player } from "../player";
import { AudioFilter } from "../transcoder";

export class PlayCommand extends BaseCommand {
    private static _queryOption = "query";
    private static _modificationOption = "modification";
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
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!await this.joinVoiceChannel(interaction))
            return;

        await interaction.deferReply();

        const query = interaction.options.getString(PlayCommand._queryOption, true);
        const modification = interaction.options.getInteger(PlayCommand._modificationOption) as AudioFilter | null;

        const data = await this._player.play(query, modification ? [modification] : undefined);

        const embed = new MessageEmbed()
            .setTitle(data.isPlayingNow ? "Now playing" : "Queued")
            .setDescription(Formatters.inlineCode(data.title))
            .setThumbnail(data.thumbnailUrl)
            .addField("Duration", data.formattedDuration)

        if (!data.isPlayingNow) {
            const queueEndTime = this._player.getQueueEndTime();

            const date = new Date(0);
            date.setSeconds(queueEndTime! - data.durationInSeconds);
            const queueEndTimeFormatted = date.toISOString().substring(11, 19);

            const date2 = new Date(0);
            date2.setSeconds(queueEndTime!);
            const queueEndTimeFormatted2 = date2.toISOString().substring(11, 19);

            embed.addField("Time until play", queueEndTimeFormatted, true);
            embed.addField("Time until queue end", queueEndTimeFormatted2, true);
        }

        await interaction.editReply({ embeds: [embed] });
    }
}
