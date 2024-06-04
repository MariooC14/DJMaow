import { SlashCommandBuilder } from 'discord.js';
import { musicPlayer } from '../../main';
import { Command } from '../../types';

export const resumeCommand: Command = {
  command: new SlashCommandBuilder().setName('resume').setDescription('Resume the current song'),
  async execute(interaction) {
    musicPlayer.unpause();
    await interaction.reply('Resumed.');
  },
};
