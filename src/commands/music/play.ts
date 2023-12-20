import { SlashCommandBuilder } from 'discord.js';
import { Command, Song } from '../../types';
import { decode } from 'he';
import { musicPlayer } from '../../main';

const spotifyLink = 'https://open.spotify.com';

export const playCommand: Command = {
  command: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song (WIP)')
    .addStringOption((option) => option.setName('song').setDescription('The name of the song or the link to it'))
    .addStringOption((option) => option.setName('playlist').setDescription('The link to the youtube playlist (beta)')),
  execute: async (interaction) => {
    // If input was given, turn it to a string, else make them null. This is to prevent the String() function from turning undefined to a string
    const songOption = interaction.options.get('song')?.value;
    const playlistOption = interaction.options.get('playlist')?.value;
    // Get name of song and/or link of playlist
    const songName = songOption ? String(songOption) : undefined;
    const playlistLink = playlistOption ? String(playlistOption) : undefined;

    // Get channel the user is in
    // @ts-expect-error - voice may not exist
    const voiceChannel = interaction.member?.voice.channel;

    // Don't join if the user is not in a channel
    if (!voiceChannel) {
      await interaction.reply('You must be in a channel to listen to a song.');
      return;
    }

    // If the user did not provide a song name or playlist link, resume the currently playing song
    if (!playlistLink && !songName) {
      if (musicPlayer.isConnected || musicPlayer.paused) {
        musicPlayer.unpause();
        return await interaction.reply('Resumed song');
        // Handle user trying to resume a song when the bot is not playing anything.
      }
      else {
        return await interaction.reply('No song to resume. If you are trying to play a song, make sure you are selecting the `song` option.');
      }
    }

    await interaction.deferReply();

    // IMPORTANT: I decided that, for now, the bot can only either add a song or a playlist per interaction.

    let playlistAdded = false;
    let songResult: Song | undefined;

    // If the user input the playlist link, search for its videos
    if (playlistLink) {
      await interaction.editReply('Trying to add your playlist...');
      playlistAdded = await musicPlayer.addPlaylistToQueue(playlistLink);

      if (playlistAdded) {
        // TODO: Reply with the playlist's name
        await interaction.followUp('Success! Added your playlist to the queue');
      }
      else {
        return await interaction.editReply('Couldn\'t add your playlist. Maybe it was made private?');
      }
    }
    else if (songName) {
      if (songName.startsWith(spotifyLink)) {
        await interaction.reply('I don\'t support Spotify Links brev.');
        return;
      }

      await interaction.editReply('Searching for song...');
      // If the bot is joining for the first time, wait for it to find the song
      // await interaction.deferReply();
      songResult = await musicPlayer.searchForSong(songName);
      if (songResult) {
        musicPlayer.addSongToQueue(songResult);
      }
      else {
        return await interaction.editReply('Could not find song with that name.');
      }
    }

    // If music player is not in channel OR if the music player IS already playing
    // When 2 users use this command, start playing
    if (!musicPlayer.isConnected) {

      // Check if bot can join the voice channel
      if (!interaction.guild?.members.me?.permissionsIn(voiceChannel).has('Connect')) {
        return await interaction.editReply('I could not join your voice channel. Maybe I don\'t have the permissions?');
      }

      // TODO: Fix this showing when a playlist failed to be added
      musicPlayer.printQueue();
      await musicPlayer.joinChannel(voiceChannel.id, interaction.guildId || '', interaction.guild?.voiceAdapterCreator);
      await musicPlayer.startPlaying();
      await interaction.editReply(`Currently playing **${decode(musicPlayer.currentSong?.title || '')}**`);

    }

    else {
      if (!musicPlayer.isPlaying && !musicPlayer.paused) {
        musicPlayer.playNextSong();
      }
      // If a song was added while the bot is playing a song, just say it was added to the queue.
      if (songResult) {
        await interaction.editReply(`Added **${decode(songResult?.title || '')}** to the queue.`);
      }
    }
  },
};
