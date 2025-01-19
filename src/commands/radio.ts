import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction, EmbedBuilder, inlineCode, MessageFlags } from "discord.js";
import { getRadioStationName, getRadioStationUrl, RadioStation } from "../radio";

export class RadioCommand extends BaseCommand {
    public data: SlashCommandBuilder;
    private static readonly stationOption = "station";
    private static readonly forcePlayNextOption = "force_play_next";
    private static readonly volumeOption = "volume";
    private static readonly invisibleOption = "invisible";

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("radio")
            .setDescription("Play radio");
        this.data.addIntegerOption(option => option
            .setName(RadioCommand.stationOption)
            .setDescription("Radio station selection")
            .setRequired(true)
            .addChoices(...[
                RadioStation.PowerHitRadio,
                RadioStation.M1
            ].map(radioStation => ({ name: getRadioStationName(radioStation), value: radioStation }))));
        this.data.addBooleanOption(option => option
            .setName(RadioCommand.forcePlayNextOption)
            .setDescription("Forces to play song as the first in the queue"));
        this.data.addIntegerOption(option => option
            .setName(RadioCommand.volumeOption)
            .setDescription("Modifies the volume of the song (default is 100)"));
        this.data.addBooleanOption(option => option
            .setName(RadioCommand.invisibleOption)
            .setDescription("Makes the bot reply with the song data invisible to other users"));
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!await this.joinVoiceChannel(interaction))
            return;

        const radioStation = interaction.options.get(RadioCommand.stationOption, true).value as RadioStation;
        const forcePlayNext = interaction.options.get(RadioCommand.forcePlayNextOption)?.value as boolean | undefined;
        const volume = interaction.options.get(RadioCommand.volumeOption)?.value as number | undefined;
        const invisible = interaction.options.get(RadioCommand.invisibleOption)?.value as boolean | undefined;

        await interaction.deferReply(invisible ? { flags: MessageFlags.Ephemeral } : {});

        const name = getRadioStationName(radioStation);

        const isPlayingNow = await this._player.playCustom(
            getRadioStationUrl(radioStation),
            name,
            Infinity,
            forcePlayNext,
            volume,
        );

        const embed = new EmbedBuilder()
            .setTitle(isPlayingNow ? "Now playing" : "Queued")
            .setDescription(inlineCode(name))
            .addFields({ name: "Duration", value: Infinity.toString() })

        await interaction.editReply({ embeds: [embed] });
    }
}
