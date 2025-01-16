import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction } from "discord.js";

export class PauseCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("pause")
            .setDescription("Pauses current song");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        this._player.pause();
        await interaction.editReply("Paused current song");
    }
}
