import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { musicPlayer } from '../../main';
import { decode } from 'he';

export const skipToCommand: Command = {
	command: new SlashCommandBuilder()
		.setName('skipto')
		.setDescription('Skip to a specific song in the queue')
		.addIntegerOption((option) => {
			return option
				.setName('position')
				.setDescription('The position of the song in queue')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(100);
		}),
	execute: async (interaction) => {
		const position = Number(interaction.options.get('position')?.value);
		// If the music player could skip to that song
		if (musicPlayer.skipTo(position)) {
			const currSong = musicPlayer.currentSong;
			await interaction.reply(`Skipped to **${decode(currSong?.title || '')}**`);
		}
		else {
			await interaction.reply('No song found at that position');
		}
	},
};
