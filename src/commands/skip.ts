import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand } from "./baseCommand";
import { Player } from "../player";

/**
 * Command to skip the currently playing song.
 */
export class SkipCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("skip")
            .setDescription("Skips current song");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        this._player.skip();
        await interaction.editReply("Skipped current song.");
    }
}
