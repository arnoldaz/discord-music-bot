import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction } from "discord.js";
import { Logger } from "../logger";

export class NowPlayingCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("np")
            .setDescription("Currently playing song.");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const voiceChannel = this.getVoiceChannel(interaction);

        if (!voiceChannel) {
            Logger.logInfo("User not in voice channel");
            return;
        } 

        const currentSong = this._player.getCurrentlyPlaying();
        await interaction.editReply(
            currentSong 
                ? `Currently playing: \`${currentSong.title}\` (\`${currentSong.formattedDuration}\`)`
                : "Nothing is currently playing."
        );
    }
}