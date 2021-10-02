import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { BaseCommand } from './commands/baseCommand';
import { Logger } from './logger';

export async function registerCommands(
	commands: BaseCommand[],
	global: Boolean = false
) {
	const commandsData = commands.map(command => command.data.toJSON());
	const rest = new REST({ version: "9" }).setToken(process.env.BOT_TOKEN!);

	try {
		await rest.put(
			global 
				? Routes.applicationCommands(process.env.CLIENT_ID!)
				: Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
			{ body: commandsData },
		);

		Logger.log(`Successfully registered ${global ? "global" : "server"} commands.`)
	} catch (error) {
		Logger.log(`Command registering failed: ${error}`);
	}
};