import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import fs from 'fs';

const commandDescriptions = JSON.parse(fs.readFileSync('src/assets/command_overview.json', 'utf-8'));

type commandName = 'play'| 'pause' | 'resume' | 'skip' | 'stop' | 'queue' | 'clear' | 'skipto' | 'fuckyoudavid'| null

export const helpCommand: Command = {
  command: new SlashCommandBuilder().setName('help').setDescription('Command guide')
    .addStringOption(option =>
      option.setName('command').setDescription('The command you need help with')
        .addChoices(
          { name: 'play', value: 'play' },
          { name: 'pause', value: 'pause' },
          { name: 'resume', value: 'resume' },
          { name: 'skip', value: 'skip' },
          { name: 'stop', value: 'stop' },
          { name: 'queue', value: 'queue' },
          { name: 'clear', value: 'clear' },
          { name: 'skipto', value: 'skipto' },
          { name: 'fuckyoudavid', value: 'fuckyoudavid' },
        ),
    ),
  execute: async (interaction) => {
    const command = interaction.options.getString('command') as commandName;

    // Reply with an overview of the commands.
    if (!command) {
      await interaction.reply(commandDescriptions['overview'].description);
    }
    else {
      await interaction.reply(commandDescriptions[command].description);
    }
  },
};
