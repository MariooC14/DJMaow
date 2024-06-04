import { Command } from '../../types';
import { SlashCommandBuilder } from 'discord.js';
import { musicPlayer } from '../../main';
import { decode } from 'he';

export const showQueueCommand: Command = {
  command: new SlashCommandBuilder().setName('queue').setDescription('See what songs are in the queue.'),
  async execute(interaction) {
    const queue = musicPlayer.queue;
    if (queue !== undefined && queue.length !== 0) {
      let songCount = 0;
      let queueDisplay = 'Here\'s what\'s in the queue so far:\n';
      queue.forEach((song) => {queueDisplay += `${songCount++}.\t**${(decode(song.title || ''))}**\n`;});
      await interaction.reply(queueDisplay);
    }
    else {
      await interaction.reply('There are currently *no songs* in the queue');
    }
  },
};
