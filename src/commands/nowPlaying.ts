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
        await interaction.editReply(
            currentSong
                ? `Currently playing: ${Formatters.inlineCode(currentSong.title)}${currentSong.type == AudioType.Song ? ` (${Formatters.inlineCode(currentSong.formattedDuration)})` : ""}`
                : "Nothing is currently playing."
        );
    }
}
