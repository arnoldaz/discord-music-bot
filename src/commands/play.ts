import { createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";

import { BaseCommand } from "./baseCommand";
import { YoutubeDownloader } from "../youtubeDownloader";
import { Logger } from "../logger";

export class PlayCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(private _downloader: YoutubeDownloader) {
        super();

        this.data = new SlashCommandBuilder()
            .setName("play")
            .setDescription("Plays music from Youtube");
        this.data.addStringOption(option => option
            .setName("query")
            .setDescription("Search for Youtube music video")
            .setRequired(true)
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const query = interaction.options.getString("query")!;

        const guild = interaction.guild!;
        const guildId = interaction.guildId!;
        const member = interaction.member! as GuildMember;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            Logger.log("User not in voice channel");
            return;
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: guild.voiceAdapterCreator,
        });
        const player = createAudioPlayer();

        const downloadData = await this._downloader.download(query);
        const resource = createAudioResource(downloadData.data);
        
        player.play(resource);
        connection.subscribe(player);

        await interaction.editReply(`Now playing: \`${downloadData.title}\` (\`${downloadData.formattedDuration}\`)`);
    }
}