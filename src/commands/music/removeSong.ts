import { SlashCommandBuilder, SlashCommandIntegerOption } from 'discord.js';
import { Command } from '../../types';
import { musicPlayer } from '../../main';

export const removeSongCommand: Command = {
	command: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove a song from the queue')
		.addIntegerOption((option: SlashCommandIntegerOption) => {
			return option
				.setName('position')
				.setDescription('The position of the song in queue')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(100);
		}),
	execute: async (interaction) => {
		const position = Number(interaction.options.get('position')?.value);
		const songRemoved = musicPlayer.removeSong(position);
		if (songRemoved) {
			await interaction.reply(`Removed **${songRemoved.title}**`);
		}
		else {
			await interaction.reply('Could not find song at that position');
		}
	},
};
