import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction } from "discord.js";
import { Logger } from "../logger";

export class ShuffleCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("shuffle")
            .setDescription("Shuffle queue.");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const voiceChannel = this.getVoiceChannel(interaction);

        if (!voiceChannel) {
            Logger.logInfo("User not in voice channel");
            return;
        } 

        this._player.shuffleQueue();
        await interaction.editReply("Queue shuffled.");
    }
}