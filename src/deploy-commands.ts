/**
 * This is the file used to register the bot's commands to discord.
 */
import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
config();
import { Command } from './types';
import { registeredCommands } from './commands';

const commands: Command[] = [];

registeredCommands?.forEach((command) => {
  if ('command' in command && 'execute' in command) {
    commands.push(command.command.toJSON());
    console.log('Loaded ' + command.command.name);
  }
  else {
    console.log(
      `[WARNING] The command at ${command} is missing a required "command" or "execute" property.`,
    );
  }
});

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.SECRET || '');

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID || '', process.env.GUILD_ID || ''),
      { body: commands },
    );

    console.log(
      `Successfully reloaded ${commands.length} application (/) commands.`,
    );
  }
  catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
