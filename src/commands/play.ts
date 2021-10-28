import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { BaseCommand } from "./baseCommand";
import { Logger } from "../logger";
import { Player } from "../player";
import { AudioFilter } from "../transcoder";

export class PlayCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("play")
            .setDescription("Plays music from Youtube");
        this.data.addStringOption(option => option
            .setName("query")
            .setDescription("Search for Youtube music video")
            .setRequired(true)
        );
        this.data.addIntegerOption(option => option
            .setName("modification")
            .setDescription("Modifies song")
            .addChoice("Nightcore", AudioFilter.Nightcore)  
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        // const embed = new MessageEmbed().setTitle('testing');
        // const messageId = await interaction.reply({ embeds: [ embed ] });

        const query = interaction.options.getString("query")!;

        const modification = interaction.options.getInteger("modification");
        Logger.logInfo(`Got modification: ${modification}`);

        const voiceChannel = this.getVoiceChannel(interaction);

        if (!voiceChannel) {
            Logger.logInfo("User not in voice channel");
            return;
        } 

        const data = await this._player.play(voiceChannel, query, modification ? [modification - 1 as AudioFilter] : []);

        await interaction.editReply(
            (data.playingNow ? "Now playing: " : "Queued: ") +
            `\`${data.title}\` (\`${data.formattedDuration}\`)`
        );
    }
}