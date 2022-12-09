import { CommandInteraction, GuildMember, StageChannel, VoiceChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";

/** Base user interaction command. */
export abstract class BaseCommand {
    public abstract data: SlashCommandBuilder;

    /**
     * Execute current command.
     * @param interaction Command interaction.
     */
    public abstract execute(interaction: CommandInteraction): Promise<void>;

    protected constructor(protected _player: Player) {}

    /**
     * Gets currently interacting user voice channel.
     * @param interaction Command interaction.
     * @returns Voice channel if user currently is in voice channel, null otherwise.
     */
    protected getVoiceChannel(interaction: CommandInteraction): VoiceChannel | StageChannel | null {
        return (interaction.member as GuildMember)?.voice.channel;
    }

    /**
     * Joins player to currently interacting user voice channel.
     * @param interaction Command interaction.
     * @returns True if player has successfully joined or are already in channel, false otherwise.
     */
    protected async joinVoiceChannel(interaction: CommandInteraction): Promise<boolean> {
        if (this._player.isConnected)
            return true;

        const voiceChannel = this.getVoiceChannel(interaction);
        if (!voiceChannel) {
            await interaction.reply({
                content: "Bot is not connected and user not in channel.",
                ephemeral: true,
            });
            return false;
        }

        await this._player.connect(voiceChannel);
        return true;
    }
}
