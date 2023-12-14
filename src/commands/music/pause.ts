import { musicPlayer } from '../../main';
import { SlashCommandBuilder } from 'discord.js';
import { CommandInteraction } from 'discord.js';

export const pauseCommand = {
	command: new SlashCommandBuilder().setName('pause').setDescription('Pause the current song'),
	async execute(interaction: CommandInteraction) {
		if (musicPlayer.pause()) {
			await interaction.reply('Paused current song');
		}
		else {
			await interaction.reply('Song already paused');
		}
	},
};
