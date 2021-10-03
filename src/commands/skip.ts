import { BaseCommand } from "./baseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Player } from "../player";
import { CommandInteraction, GuildMember } from "discord.js";
import { Logger } from "../logger";



export class SkipCommand extends BaseCommand {
    public data: SlashCommandBuilder;

    public constructor(private _player: Player) {
        super();

        this.data = new SlashCommandBuilder()
            .setName("skip")
            .setDescription("Skip current song");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const member = interaction.member! as GuildMember;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            Logger.log("User not in voice channel");
            return;
        } 

        this._player.skip();

        await interaction.editReply("Skipped current song.");
    }
}