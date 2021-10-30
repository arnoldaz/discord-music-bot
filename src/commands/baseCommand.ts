import { CommandInteraction, GuildMember, StageChannel, VoiceChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";

export abstract class BaseCommand {
    public abstract data: SlashCommandBuilder;
    public abstract execute(interaction: CommandInteraction): Promise<void>;

    protected constructor(protected _player: Player) { }

    protected getVoiceChannel(interaction: CommandInteraction): VoiceChannel | StageChannel | null {
        return (interaction.member as GuildMember)?.voice.channel;
    }

    protected async joinVoiceChannel(interaction: CommandInteraction): Promise<boolean> {
        if (!this._player.isConnected) {
            const voiceChannel = this.getVoiceChannel(interaction);
            if (!voiceChannel) {
                await interaction.reply({ content: "Bot is not connected and user not in channel.", ephemeral: true });
                return false;
            }

            await this._player.connect(voiceChannel);
        }
        return true;
    }
}
