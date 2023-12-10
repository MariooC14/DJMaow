import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";
import { decode } from "he";
import { musicPlayer } from "../../main";
import { log } from "console";

const spotifyLink = "https://open.spotify.com";

export const playCommand: Command = { 
    command: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song (WIP)')
    .addStringOption((option: any) => option.setName('song').setDescription('Song to play')),
    execute: async (interaction: CommandInteraction) => {
      // Get name of song
      const songName: string = String(interaction.options.get('song')?.value);
      // Get channel the user is in
      //@ts-ignore
      const voiceChannel = interaction.member?.voice.channel;

      if (songName.startsWith(spotifyLink)) {
        await interaction.reply("I don't support Spotify Links brev.");
        return;
      }

      // Don't join if there is no channel the user is in.
      if (!voiceChannel) {
        await interaction.reply('You must be in a channel to listen to a song.');
        return;
      }

      // If the user entered just /play, it means they want to resume the song.
      if (!songName) {
        musicPlayer.unpause();
        await interaction.reply('Resumed song');
        return;
      }
      await interaction.deferReply();

      // Add song to queue
      await interaction.editReply('Searching for song...');

      // If music player is not in channel OR if the music player IS already playing 
      // When 2 users use this command, start playing
      if (!musicPlayer.isConnected || !musicPlayer.isPlaying) {
        console.log("Trying to find song")

        // Set player to playing to avoid race conditions. 
        musicPlayer.playing = true;

        // If the bot is joining for the first time, wait for it to find the song
        let addedSong = await musicPlayer.addToQueue(songName);

        if (!addedSong) {
          await interaction.followUp(`Could not find song with that name`);
          return;
        }
        
        console.log("Attempting to join channel")
        // Check if bot can join the voice channel
        if (!interaction.guild?.members.me?.permissionsIn(voiceChannel).has("Connect")) {
          await interaction.editReply("I could not join your voice channel. Maybe I don't have the permissions?");
          return;
        }
        await musicPlayer.joinChannel(voiceChannel.id, interaction.guildId|| "", interaction.guild?.voiceAdapterCreator);
        await musicPlayer.startPlaying();
        await interaction.editReply(`Currently playing **${decode(musicPlayer.currentSong?.title || "")}**`);

      } else {
        // Else add it in the background.
        const addedSong = await musicPlayer.addToQueue(songName);
        if (!musicPlayer.isPlaying && !musicPlayer.paused) {
          musicPlayer.playNextSong();
        }
        console.log(addedSong);
        await interaction.editReply(`Added **${decode(addedSong?.title || "")}** to the queue.`);
      }
    }
  }