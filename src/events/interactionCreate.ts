import { BotEvent } from '../types';
import { Interaction } from 'discord.js';

export const interactionHandler: BotEvent = {
  name: 'interactionCreate',
  execute: async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        return console.error(`No command matching ${interaction.commandName} was found.`);
      }
      try {
        await command.execute(interaction);
      }
      catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
        await interaction.reply('I don\'t respond to that command chief');
      }
    }
    else if (interaction.isButton()) {
      // Respond to the button
    }
    else if (interaction.isStringSelectMenu()) {
      // Respond to the select menu
    }
  },
};
