import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';

export const helpCommand: Command = {
  command: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Command guide')
    .addStringOption(option =>
      option.setName('command')
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
          { name: 'help', value: 'help' },
        ),
    ),
  execute: async (interaction) => {
    const command = interaction.options.getString('command');
    console.log(command);
    console.log('hi');

  },
};
