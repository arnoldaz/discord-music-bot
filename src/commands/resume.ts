import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand } from "./baseCommand";
import { Player } from "../player";

/**
 * Command to resume the paused song.
 */
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
        await interaction.editReply("Resumed current song.");
    }
}
