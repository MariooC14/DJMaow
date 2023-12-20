import { SlashCommandBuilder } from 'discord.js';
import { musicPlayer } from '../../main';
import { Command } from '../../types';

export const skipCommand: Command = {
	command: new SlashCommandBuilder().setName('skip').setDescription('skip the current song'),
	execute: async (interaction) => {
		musicPlayer.playNextSong();
		console.info(`${interaction.user.displayName} skipped the current song.`);
		await interaction.reply('Skipped song.');
	}
};
