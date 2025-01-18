import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, inlineCode, EmbedBuilder, MessageFlags } from "discord.js";
import { BaseCommand } from "./baseCommand";
import { Player } from "../player";
import { convertToTimeString, Seconds } from "../timeFormat";
import { getCustomSongPath } from "../localFiles";

enum CustomSong {
    PantheonZama = 0,
    ShrekIsLove = 1,
}

interface CustomSongData {
    fileName: string;
    title: string;
    duration: Seconds;
}

const CUSTOM_SONG_DATA_MAP: Record<CustomSong, CustomSongData> = {
    [CustomSong.PantheonZama]: {
        fileName: "pantheon-zama.mp4",
        title: "Pantheon zama",
        duration: 63,
    },
    [CustomSong.ShrekIsLove]: {
        fileName: "shrek-is-love-1.mp4",
        title: "Shrek is love",
        duration: 142,
    },
}

export class PlayCustomCommand extends BaseCommand {
    public data: SlashCommandBuilder;
    private static readonly customSong = "custom-song";
    private static readonly forcePlayNextOption = "force-play-next";
    private static readonly volumeOption = "volume";
    private static readonly invisibleOption = "invisible";

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("playcustom")
            .setDescription("Plays custom local song");
        this.data.addIntegerOption(option => option
            .setName(PlayCustomCommand.customSong)
            .setDescription("Custom song")
            .setRequired(true)
            .addChoices(...[
                CustomSong.PantheonZama,
                CustomSong.ShrekIsLove,
            ].map(filter => ({ name: CustomSong[filter], value: filter }))));
        this.data.addBooleanOption(option => option
            .setName(PlayCustomCommand.forcePlayNextOption)
            .setDescription("Forces to play song as the first in the queue"));
        this.data.addIntegerOption(option => option
            .setName(PlayCustomCommand.volumeOption)
            .setDescription("Modifies the volume of the song (default is 100)"));
        this.data.addBooleanOption(option => option
            .setName(PlayCustomCommand.invisibleOption)
            .setDescription("Makes the bot reply with the song data invisible to other users"));
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!await this.joinVoiceChannel(interaction))
            return;

        const customSong = interaction.options.get(PlayCustomCommand.customSong, true).value as CustomSong;
        const forcePlayNext = interaction.options.get(PlayCustomCommand.forcePlayNextOption)?.value as boolean | undefined;
        const volume = interaction.options.get(PlayCustomCommand.volumeOption)?.value as number | undefined;
        const invisible = interaction.options.get(PlayCustomCommand.invisibleOption)?.value as boolean | undefined;
        
        await interaction.deferReply(invisible ? { flags: MessageFlags.Ephemeral } : {});

        const songData = CUSTOM_SONG_DATA_MAP[customSong];

        const isPlayingNow = await this._player.playCustom(
            getCustomSongPath(songData.fileName),
            songData.title,
            songData.duration,
            forcePlayNext,
            volume,
        );

        const embed = new EmbedBuilder()
            .setTitle(isPlayingNow ? "Now playing" : "Queued")
            .setDescription(inlineCode(songData.title))
            .addFields({ name: "Duration", value: convertToTimeString(songData.duration, true) })

        await interaction.editReply({ embeds: [embed] });
    }
}
