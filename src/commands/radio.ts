import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction, Formatters } from "discord.js";
import { RadioStation } from "../transcoder";

export class RadioCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(player: Player) {
        super(player);

        this.data = new SlashCommandBuilder()
            .setName("radio")
            .setDescription("Play radio");
        this.data.addIntegerOption(option => option
            .setName("station")
            .setDescription("Radio station selection")
            .addChoices()
            .addChoices(...[RadioStation.PowerHitRadio, RadioStation.M1].map(radioStation => {
                return { name: Player.radioStationNames[radioStation], value: radioStation };
            }))
            .setRequired(true)
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!await this.joinVoiceChannel(interaction))
            return;

        await interaction.deferReply();

        const radioStation = interaction.options.getInteger("station")! as RadioStation;
        this._player.playRadio(radioStation);

        await interaction.editReply(`Playing radio station ${Formatters.inlineCode(Player.radioStationNames[radioStation])}`);
    }
}
