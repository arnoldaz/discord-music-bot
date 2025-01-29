import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction, inlineCode } from "discord.js";
import { convertToTimeString } from "../timeFormat";

export class QueueCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("queue")
            .setDescription("Shows current queue");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const queue = this._player.queue.map((audio, i) => `${i+1}: ${inlineCode(audio.title)} (${convertToTimeString(audio.duration, true)})`);
        if (queue.length == 0) {
            await interaction.editReply("Current queue is empty.");
            return;
        }

        const messagesText = this.splitIntoMessages(queue, 4000);

        let lastMessage = await interaction.editReply({ embeds: [{ title: "Current queue", description: messagesText[0] }] });
        for (const messageText of messagesText.slice(1)) {
            lastMessage = await lastMessage.reply({ embeds: [{ description: messageText }] });
        }
    }
}
