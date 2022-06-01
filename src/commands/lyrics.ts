import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction, Formatters, MessageEmbed, Util } from "discord.js";

export class LyricsCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("lyrics")
            .setDescription("Gets lyrics.");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const song = this._player.currentlyPlaying;
        const lyrics = await this._player.getLyrics();

        if (!lyrics) {
            await interaction.editReply("Lyrics are not found for current song.");
            return;
        }

        const [initialDesc, ...otherDescs] = LyricsCommand.splitMessage(lyrics, { maxLength: 4096 });
        const embed = new MessageEmbed().setDescription(initialDesc);

        await interaction.editReply({
            content: `Found lyrics for ${Formatters.inlineCode(song!.title)}:`,
            embeds: [embed],
        });

        if (!otherDescs.length)
            return;

        otherDescs.forEach(async desc => {
            embed.setDescription(desc);
            await interaction.followUp({ embeds: [embed] });
        });
    }

    // Copied deprecated discord.js method for now
    private static splitMessage(text: string, { maxLength = 2_000, char = '\n', prepend = '', append = '' } = {}) {
        text = Util.verifyString(text);
        if (text.length <= maxLength) return [text];
        let splitText = [text];
        if (Array.isArray(char)) {
          while (char.length > 0 && splitText.some(elem => elem.length > maxLength)) {
            const currentChar = char.shift();
            if (currentChar instanceof RegExp) {
              splitText = splitText.flatMap(chunk => chunk.match(currentChar)!);
            } else {
              splitText = splitText.flatMap(chunk => chunk.split(currentChar));
            }
          }
        } else {
          splitText = text.split(char);
        }
        if (splitText.some(elem => elem.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
        const messages = [];
        let msg = '';
        for (const chunk of splitText) {
          if (msg && (msg + char + chunk + append).length > maxLength) {
            messages.push(msg + append);
            msg = prepend;
          }
          msg += (msg && msg !== prepend ? char : '') + chunk;
        }
        return messages.concat(msg).filter(m => m);
    }
}
