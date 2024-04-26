import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
  autocomplete?: (interaction: AutocompleteInteraction) => void,
  command: | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>
      | SlashCommandSubcommandsOnlyBuilder,
  cooldown?: number,
  execute: (interaction: ChatInputCommandInteraction) => void
}

export interface BotEvent {
  name: string,
  once?: boolean | false,
  execute: (...args?) => void
}

export interface Song {
  kind?: 'youtube#channel' | 'youtube#video',
  title?: string,
  videoId: string,
  /** A song may belong to a playlist. */
  playlistId?: string,
  link: string | undefined
}

/**
 * Stores information about a playlist and its state in a music player
 */
export interface Playlist {
  id: string,
  totalSongs: number,
  videosPerPage: number,
  currentSongIndex: number,
  autoFetch: boolean,
  nextPageToken: string
}

declare module 'discord.js' {
  export interface Client {
      commands: Collection<string, SlashCommand>
      // cooldowns: Collection<string, number>
  }
}

/**
 * The 'items' section of the YouTube data API response
 */
interface YoutubePlaylistItem {
    kind: string,
    etag: string,
    id: string,
    contentDetails: {
      videoId: string,
      videoPublishedAt: string
    }
}

/**
 * The data the YouTube API would respond with
 */
export interface YouTubePlaylistItemResponse {
  // TODO: Make error a more specific type
  error,
  kind: string,
  etag: string,
  nextpageToken: string,
  items: YoutubePlaylistItem[],
  pageInfo: {
    totalResults: number,
    resultsPerPage: number
  }
}