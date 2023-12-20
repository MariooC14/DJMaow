import { Command } from '../../types';
import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { musicPlayer } from '../../main';

export const clearQueueCommand: Command = {
  command: new SlashCommandBuilder().setName('clear').setDescription('Clear the queue'),
  execute: async (interaction: CommandInteraction) => {
    musicPlayer.clearQueue();
    await interaction.reply('Cleared the queue');
  },
};
