import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from 'discord.js';
import { Playlist } from '../../types';
import { musicPlayer } from '../../main';

/**
 * The playlist wizard works some magic. It ensures proper functioning of playlists.
 * Because the YouTube Data v3 API uses pagination for playlists, you can only fetch 5 videos per request.
 * This response gives you the nextPageToken for making requests for the next videos.
 * It asks the user for an auto mode option, which automatically fetches the next 5 videos when most videos are played.
 * It may ask the user for other things too (TBD)
 */
export default async function startPlayListWizard(interaction: ChatInputCommandInteraction, playlistLink: string) {
  // Build the message components
  const confirm = new ButtonBuilder()
    .setCustomId('playlist-mode-on')
    .setLabel('ON')
    .setStyle(ButtonStyle.Success);

  const deny = new ButtonBuilder()
    .setCustomId('playlist-mode-off')
    .setLabel('OFF')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(confirm, deny);

  // Send the first response of the playlist wizard
  const response = await interaction.reply({
    content: '## Playlist wizard 🧙\nThe service that DJ Maow uses for finding YouTube videos uses pagination, in that it only fetches 5 videos per request.\nIf you turn auto mode on, DJ Maow will automatically fetch the next 5 videos when of the previous songs have been played or skipped.\nDo you want auto mode on?',
    components: [row],
  });

  // TODO: Specify type
  const collectorFilter = (i) => i.user.id === interaction.user.id;

  let autoMode = false;

  try {
    // Wait for user to click on the button
    const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

    if (confirmation.customId === 'playlist-mode-on') {
      await confirmation.update({ content: 'Auto mode is on!', components: [] });
      autoMode = true;
    }
    else if (confirmation.customId === 'playlist-mode-off') {
      await confirmation.update({ content: 'Auto mode is off. Only adding the first 5 songs to the queue.', components: [] });
    }
  }
  catch (e) {
    console.error('error:', e.message);
    return await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components:[] });
  }

  // Search for the playlist on youtube.
  const playlistWithVideos = await musicPlayer.searchForPlaylist(playlistLink);

  if (!playlistWithVideos) {
    return await interaction.editReply({ content: 'The link is invalid. Are you sure it\' a public playlist?', components:[] });
  }

  const playlist = {
    id: playlistWithVideos.playlistId,
    totalSongs: playlistWithVideos.totalVideos,
    videosPerPage: playlistWithVideos.videosPerPage,
    currentSongIndex: 1,
    nextPageToken: playlistWithVideos.nextPageToken,
    autoFetch: autoMode,
  } as Playlist;

  await musicPlayer.addPlaylistToQueue(playlist, playlistWithVideos.videoIds);
};