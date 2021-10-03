import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import { BaseCommand } from "./baseCommand";
import { Logger } from "../logger";
import { Player } from "../player";

export class PlayCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(private _player: Player) {
        super();

        this.data = new SlashCommandBuilder()
            .setName("play")
            .setDescription("Plays music from Youtube");
        this.data.addStringOption(option => option
            .setName("query")
            .setDescription("Search for Youtube music video")
            .setRequired(true)
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const query = interaction.options.getString("query")!;

        const guild = interaction.guild!;
        const guildId = interaction.guildId!;
        const member = interaction.member! as GuildMember;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            Logger.log("User not in voice channel");
            return;
        } 

        const data = await this._player.play(voiceChannel, query);

        await interaction.editReply(
            (data.playNow ? "Now playing: " : "Queued: ") +
            `\`${data.title}\` (\`${data.formattedDuration}\`)`
        );
    }
}