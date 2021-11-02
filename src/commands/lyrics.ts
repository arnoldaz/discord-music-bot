import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction } from "discord.js";

export class LyricsCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder().setName("lyrics").setDescription("Gets lyrics.");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        // TODO
        await interaction.editReply("Queue shuffled.");
    }
}
