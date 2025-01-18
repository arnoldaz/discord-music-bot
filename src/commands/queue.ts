import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { AudioType, Player } from "../player";
import { CommandInteraction, inlineCode, verifyString } from "discord.js";
import { convertToTimeString } from "../timeFormat";

export class QueueCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("queue")
            .setDescription("Shows current queue.");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const queue = this._player.queue
            .map((x, i) => `${i + 1}: ${inlineCode(x.title)}${x.type == AudioType.Song ? ` (${inlineCode(convertToTimeString(x.durationInSeconds))})` : ` (${inlineCode(convertToTimeString(x.durationInSeconds))})`}`)
            .join("\n");

        if (!queue) {
            await interaction.editReply("Current queue is empty.");
            return;
        }

        // TODO: refactor embed/message splitting
        const [initialDesc, ...otherDescs] = QueueCommand.splitMessage(queue, { maxLength: 1950 });
        await interaction.editReply(`Current queue: \n${initialDesc}`);

        if (!otherDescs.length)
            return;

        otherDescs.forEach(async desc => {
            await interaction.followUp(desc);
        });
    }

    // Copied deprecated discord.js method for now
    public static splitMessage(text: string, { maxLength = 2_000, char = '\n', prepend = '', append = '' } = {}) {
        text = verifyString(text);
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
