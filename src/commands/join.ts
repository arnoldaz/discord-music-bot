import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction, StageChannel, VoiceChannel, Formatters } from "discord.js";

export class JoinCommand extends BaseCommand {
    private static _nameOption: string = "name";
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("join")
            .setDescription("Joins voice channel");
        this.data.addStringOption(option => option
            .setName(JoinCommand._nameOption)
            .setDescription("Specific voice channel name")
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        const channelName = interaction.options.getString(JoinCommand._nameOption)?.toLowerCase();
        const voiceChannel = channelName
            ? await this.getSpecifiedChannel(interaction, channelName)
            : await this.getUserChannel(interaction);

        if (!voiceChannel)
            return;

        await interaction.deferReply();
        await this._player.connect(voiceChannel);
        await interaction.editReply(`Connected to voice channel: ${Formatters.inlineCode(voiceChannel.name)}`);
    }

    private async getSpecifiedChannel(interaction: CommandInteraction, channelName: string): Promise<VoiceChannel | StageChannel | null> {
        const channels = interaction.guild?.channels?.cache;
        if (!channels) {
            await interaction.reply({ content: "Could not retrieve channels list", ephemeral: true });
            return null;
        }

        const voiceChannel = channels
            .filter(channel => channel.type == "GUILD_VOICE" || channel.type == "GUILD_STAGE_VOICE")
            .filter(channel => channel.name.toLowerCase() == channelName)
            .first() as VoiceChannel | StageChannel | undefined;

        if (!voiceChannel) {
            await interaction.reply({ content: `No voice channel exists with specified name: ${Formatters.inlineCode(channelName)}`, ephemeral: true });
            return null;
        }

        return voiceChannel;
    }

    private async getUserChannel(interaction: CommandInteraction): Promise<VoiceChannel | StageChannel | null> {
        const voiceChannel = this.getVoiceChannel(interaction);
        if (!voiceChannel) {
            await interaction.reply({ content: "No channel name specified and user not in channel", ephemeral: true });
            return null;
        }

        return voiceChannel;
    }
}