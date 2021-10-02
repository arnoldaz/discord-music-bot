import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export abstract class BaseCommand {
    public abstract data: SlashCommandBuilder;
    public abstract execute(interaction: CommandInteraction): Promise<void>;
}
