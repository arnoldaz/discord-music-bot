import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction } from "discord.js";
import { Logger } from "../logger";

export class RemoveCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("remove")
            .setDescription("Removes song from queue.");
        this.data.addIntegerOption(option => option
            .setName("id")
            .setDescription("Id of song to remove from queue.")
            .setRequired(true)
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const voiceChannel = this.getVoiceChannel(interaction);

        if (!voiceChannel) {
            Logger.logInfo("User not in voice channel");
            return;
        } 

        const id = interaction.options.getInteger("id")!;
        this._player.removeSong(id);
        await interaction.editReply(`Queue item with ID \`${id.toString()}\` removed.`);
    }
}