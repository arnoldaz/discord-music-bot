import { CommandInteraction, GuildMember, StageChannel, VoiceChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";

/**
 * Base command for user slash command.
 */
export abstract class BaseCommand {
    public abstract data: SlashCommandBuilder;

    /**
     * Executes the command.
     * @param interaction Command interaction.
     */
    public abstract execute(interaction: CommandInteraction): Promise<void>;

    /**
     * Base empty constructor.
     * @param _player Shared player instance for list of commands.
     */
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

    /**
     * Splits lines to a list of messages based on their maximum length.
     * @param lines Lines to combine together using end-line symbol and split into messages.
     * @param maxMessageLength Max length that should not be passed when creating messages.
     * @returns List of messages.
     */
    protected splitIntoMessages(lines: string[], maxMessageLength: number): string[] {
        const messages: string[] = [];
        let tempMessage = "";
        for (const line of lines) {
            const updatedMessage = tempMessage + line + "\n";
            if (updatedMessage.length > maxMessageLength) {
                messages.push(tempMessage);
                tempMessage = line + "\n";
                continue;
            }
            tempMessage = updatedMessage;
        }

        messages.push(tempMessage);

        return messages;
    }
}
