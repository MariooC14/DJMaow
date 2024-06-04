import { Command } from '../../types';
import { config } from 'dotenv';
config();
import { SlashCommandBuilder } from 'discord.js';
import { musicPlayer } from '../../main';

const DavidID = process.env.DavidID;

export const fuckYouDavidCommand: Command = {
  command: new SlashCommandBuilder().setName('fuckyoudavid').setDescription('Fuck you David'),
  async execute(interaction) {
    // @ts-expect-error - voice may be null
    const voiceChannel = interaction.member?.voice.channel;
    await interaction.reply(`Fuck you <@${DavidID}>`);
    // Join the channel the suer is in and start playing the best song for David.
    if (voiceChannel) {
      if (!musicPlayer.isConnected) {
        const davidSong = await musicPlayer.searchForSong('DEMARKUS MCCLURE- FUCK YOU DAVID');
        // Add the song to the queue if it was found
        davidSong && musicPlayer.addSongToQueue(davidSong);
        await musicPlayer.joinChannel(voiceChannel.id, interaction.guildId || '', interaction.guild?.voiceAdapterCreator);
        await musicPlayer.startPlaying();
      }
    }
  },
};
