import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction } from "discord.js";

export class ResumeCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("resume")
            .setDescription("Resumes current song");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        this._player.resume();
        await interaction.editReply("Resumed current song");
    }
}
