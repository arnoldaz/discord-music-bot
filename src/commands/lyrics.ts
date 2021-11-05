import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction, Formatters, MessageEmbed, Util } from "discord.js";

export class LyricsCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder().setName("lyrics").setDescription("Gets lyrics.");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const song = this._player.getCurrentlyPlaying();
        const lyrics = await this._player.getLyrics();

        if (!lyrics) {
            await interaction.editReply("Lyrics are not found for current song");
            return;
        }

        const [initialDesc, ...otherDescs] = Util.splitMessage(lyrics, { maxLength: 4096 });
        const embed = new MessageEmbed().setDescription(initialDesc);

        await interaction.editReply({
            content: `Found lyrics for ${Formatters.inlineCode(song!.title)}:`,
            embeds: [embed],
        });

        if (!otherDescs.length) return;

        otherDescs.forEach(async desc => {
            embed.setDescription(desc);
            await interaction.followUp({ embeds: [embed] });
        });
    }
}
