import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, inlineCode, EmbedBuilder } from "discord.js";
import { BaseCommand } from "./baseCommand";
import { Player, PlayResult } from "../player";

export class PlayCustomCommand extends BaseCommand {
    private static _urlOption = "url";
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("playcustom")
            .setDescription("Plays custom video URL");
        this.data.addStringOption(option => option
            .setName(PlayCustomCommand._urlOption)
            .setDescription("Custom video URL")
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!await this.joinVoiceChannel(interaction))
            return;

        await interaction.deferReply();

        let url = interaction.options.get(PlayCustomCommand._urlOption)?.value as string | undefined;
        if (!url)
            url = "https://video.xx.fbcdn.net/v/t43.1792-2/12021243_1661321834110817_1226356561_n.mp4?_nc_cat=100&ccb=1-7&_nc_sid=985c63&efg=eyJybHIiOjE1MDAsInJsYSI6MTAyNCwidmVuY29kZV90YWciOiJoZCJ9&_nc_ohc=m07lDQypEUwAX8fTQV_&rl=1500&vabr=804&_nc_ht=video.fvno2-1.fna&oh=00_AfAsmDvrjH96tLUbFwfmQmyHUaaph7XgvfR-mxutxkATCw&oe=63CC3BFE";

        const playData = await this._player.playCustom(url);
        const data: PlayResult = playData;

        const embed = new EmbedBuilder()
            .setTitle(data.isPlayingNow ? "Now playing" : "Queued")
            .setDescription(inlineCode(data.title))
            .addFields({ name: "Duration", value: data.formattedDuration })

        await interaction.editReply({ embeds: [embed] });
    }
}
