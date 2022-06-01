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
            .addChoices(...[AudioFilter.Nightcore, AudioFilter.Earrape, AudioFilter.Audio8D]
                .map(filter => ({ name: AudioFilter[filter], value: filter })))
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!await this.joinVoiceChannel(interaction))
            return;

        await interaction.deferReply();

        const query = interaction.options.getString(PlayCommand._queryOption)!;
        const modification = interaction.options.getInteger(PlayCommand._modificationOption) as AudioFilter | null;

        const data = await this._player.play(query, modification ? [modification] : undefined);

        const embed = new MessageEmbed()
            .setTitle(data.isPlayingNow ? "Now playing" : "Queued")
            .setDescription(Formatters.inlineCode(data.title))
            .setThumbnail(data.thumbnailUrl)
            .addField("Duration", data.formattedDuration)

        await interaction.editReply({ embeds: [embed] });
    }
}
