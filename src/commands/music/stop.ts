import { Command } from '../../types';
import { SlashCommandBuilder } from 'discord.js';
import { musicPlayer } from '../../main';

export const stopPlayingCommand: Command = {
  command: new SlashCommandBuilder().setName('stop').setDescription('stop playing and leave'),
  async execute(interaction) {
    musicPlayer.stopPlaying();
    await interaction.reply('Aight I\'m out.');
  },
};
