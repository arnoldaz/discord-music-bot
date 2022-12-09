import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { AudioType, Player } from "../player";
import { CommandInteraction, Formatters } from "discord.js";
import { LyricsCommand } from "./lyrics";

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
            .map((x, i) => `${i + 1}: ${Formatters.inlineCode(x.title)}${x.type == AudioType.Song ? ` (${Formatters.inlineCode(x.formattedDuration)})` : ""}`)
            .join("\n");

        if (!queue) {
            await interaction.editReply("Current queue is empty");
            return;
        }

        // TODO: refactor embed/message splitting
        const [initialDesc, ...otherDescs] = LyricsCommand.splitMessage(queue, { maxLength: 1950 });
        await interaction.editReply(`Current queue: \n${initialDesc}`);

        if (!otherDescs.length)
            return;

        otherDescs.forEach(async desc => {
            await interaction.followUp(desc);
        });
    }
}
