import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Formatters, MessageEmbed } from "discord.js";
import { BaseCommand } from "./baseCommand";
import { Logger } from "../logger";
import { Player } from "../player";
import { AudioFilter } from "../transcoder";
import { ExtendedDataScraper } from "../newDownloader";

export class PlayCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("play")
            .setDescription("Plays music from Youtube");
        this.data.addStringOption(option => option
            .setName("query")
            .setDescription("Search for Youtube music video")
            .setRequired(true)
        );
        this.data.addIntegerOption(option => option
            .setName("modification")
            .setDescription("Modifies song")
            .addChoices({ name: "Nightcore", value: AudioFilter.Nightcore })
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!await this.joinVoiceChannel(interaction))
            return;

        await interaction.deferReply();

        const query = interaction.options.getString("query")!;

        const modification = interaction.options.getInteger("modification");
        Logger.logInfo(`Got modification: ${modification}`);

        const data = await this._player.play(query, modification != null ? [modification as AudioFilter] : []);


        const song = this._player.getCurrentlyPlaying()!;
        const extendedData = await ExtendedDataScraper.getVideoData(song.id);

        const embed = new MessageEmbed()
            .setTitle(data.playingNow ? "Now playing" : "Queued")
            .setDescription(Formatters.inlineCode(data.title))
            .setThumbnail(extendedData.thumbnail.url)
            .addField("Duration", data.formattedDuration)

        await interaction.editReply({
            // content:  (data.playingNow ? "Now playing: " : "Queued: ") +
            //     `${Formatters.inlineCode(data.title)} (${Formatters.inlineCode(data.formattedDuration)})`,
            embeds: [embed],
        });
    }
}
