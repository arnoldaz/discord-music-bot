import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction } from "discord.js";
import { Logger } from "../logger";



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

        const voiceChannel = this.getVoiceChannel(interaction);

        if (!voiceChannel) {
            Logger.logInfo("User not in voice channel");
            return;
        } 

        const queue = this._player.getQueue()
            .map((x, i) => `${i+1}: \`${x.title}\` (\`${x.formattedDuration}\`)`)
            .join("\n");

        await interaction.editReply(`Current queue: \n` + queue);
    }
}