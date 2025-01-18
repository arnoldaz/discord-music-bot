import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { AudioType, Player } from "../player";
import { CommandInteraction, EmbedBuilder, inlineCode } from "discord.js";
import { convertToTimeString } from "../timeFormat";
import { log, LogLevel } from "../logger";

export class NowPlayingCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("np")
            .setDescription("Displays currently playing song");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const data = this._player.currentlyPlaying;
        const currentTime = this._player.currentTimer;

        log(JSON.stringify(data), LogLevel.Warning);
        log(JSON.stringify(currentTime), LogLevel.Warning);

        if (!data || !currentTime) {
            await interaction.editReply("Nothing is currently playing.");
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("Now playing")
            .setDescription(inlineCode(data.title))
            .addFields({ name: "Duration", value: convertToTimeString(currentTime, true) + " / " + convertToTimeString(data.durationInSeconds, true) })

        if (data.type == AudioType.Song)
            embed.setThumbnail(data.thumbnailUrl);

        await interaction.editReply({ embeds: [embed] });
    }
}
