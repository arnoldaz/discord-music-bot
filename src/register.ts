import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { BaseCommand } from "./commands/baseCommand";
import { log, LogLevel } from "./logger";

export async function registerCommands(commands: BaseCommand[], global = false) {
    const botToken = process.env.BOT_TOKEN;
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (!botToken || !clientId || !guildId) {
        log("Command registering failed due to missing required environment variables", LogLevel.Error);
        return;
    }

    const commandsData = commands.map(command => command.data.toJSON());
    const rest = new REST({ version: "10" }).setToken(botToken);

    try {
        await rest.put(
            global
                ? Routes.applicationCommands(clientId)
                : Routes.applicationGuildCommands(clientId, guildId),
            { body: commandsData }
        );

        log(`Successfully registered ${global ? "global" : "server"} commands`, LogLevel.Info);
    } catch (error) {
        log(`Command registering failed: ${error}`, LogLevel.Error);
    }
}

export async function unregisterCommands(global = false) {
    const botToken = process.env.BOT_TOKEN;
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (!botToken || !clientId || !guildId) {
        log("Command unregistering failed due to missing required environment variables", LogLevel.Error);
        return;
    }

    const rest = new REST({ version: "10" }).setToken(botToken);

    try {
        await rest.put(
            global
                ? Routes.applicationCommands(clientId)
                : Routes.applicationGuildCommands(clientId, guildId),
            { body: [] }
        );

        log(`Successfully unregistered ${global ? "global" : "server"} commands`, LogLevel.Info);
    } catch (error) {
        log(`Command unregistering failed: ${error}`, LogLevel.Error);
    }
}
