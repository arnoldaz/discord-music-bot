import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { AudioType, Player } from "../player";
import { CommandInteraction, Formatters } from "discord.js";

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
        const currentSong = this._player.currentlyPlaying;
        const currentTime = this._player.currentTimer;

        if (!currentSong || !currentTime) {
            await interaction.editReply("Nothing is currently playing.");
            return;
        }

        const title = Formatters.inlineCode(currentSong.title);

        const date = new Date(0);
        date.setSeconds(currentTime);
        const currentFormattedTime = date.toISOString().substring(11, 19);

        const totalFormattedTime = currentSong.type == AudioType.Song 
            ? ` (${Formatters.inlineCode(currentFormattedTime)} ${Formatters.inlineCode(currentSong.formattedDuration)})` 
            : "";

        await interaction.editReply(`Currently playing: ${title}${totalFormattedTime}`);
    }
}
