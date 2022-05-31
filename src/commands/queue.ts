import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { AudioType, Player } from "../player";
import { CommandInteraction, Formatters } from "discord.js";

export class QueueCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("queue")
            .setDescription("Skip current song");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const queue = this._player.queue
            .map((x, i) => `${i + 1}: ${Formatters.inlineCode(x.title)}${x.type == AudioType.Song ? ` (${Formatters.inlineCode(x.formattedDuration)})` : ""}`)
            .join("\n");

        await interaction.editReply(queue ? `Current queue: \n` + queue : "Current queue is empty");
    }
}
