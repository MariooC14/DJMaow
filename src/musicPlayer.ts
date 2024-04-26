/**
 * The music player class. This is the manager of plays, commands etc.
 */

import {
  AudioPlayer,
  AudioPlayerError,
  AudioResource,
  createAudioPlayer,
  createAudioResource, DiscordGatewayAdapterCreator,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import sqlite3 from 'sqlite3';
import search, { YouTubeSearchResults } from 'youtube-search';
import ytPlayer, { video_basic_info, YouTubeStream } from 'play-dl';
import { Playlist, Song, YouTubePlaylistItemResponse } from './types';
import { encode } from 'he';
import queryString from 'querystring';

// YouTube Search Options
const opts = {
  maxResults: 5,
  // REQUIRED for searching songs
  key: process.env.YT_API_KEY,
  safesearch:'none',
  type: 'video',
};

export class MusicPlayer {
  private _queue: Song[] = [];
  /** Playlist queue is a set to ensure no duplicate sets */
  private _playlistsInQueue: Map<string, Playlist>;
  private _currentSong: Song| undefined;
  private _length: number;
  private _playing: boolean = false;
  private _paused: boolean = false;
  private _audioPlayer: AudioPlayer;
  private stream: YouTubeStream | undefined;
  private connection: VoiceConnection | null | undefined;
  private resource: AudioResource | undefined;
  // Only one instance of the DBMS is created between all discord servers
  public static db: sqlite3.Database | null = new sqlite3.Database(
    process.env.DB_PATH || '',
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
        MusicPlayer.db = null;
      }
      console.log('connected to the songs db');
    },
  );


  /**
	 * Stores the YouTube Search Results into the database if the database exists
	 */
  private cacheSongResults = async (songs: YouTubeSearchResults[]) => {
    if (!MusicPlayer.db) return;
    const sqlQuery = 'INSERT OR IGNORE INTO songs (title, videoId) VALUES (?, ?)';
    songs.forEach((song: YouTubeSearchResults) => {
      if (song.kind === 'youtube#channel') return;
      MusicPlayer.db?.run(sqlQuery, [song.title, song.id], (err) => {
        if (err) console.log(err.message);
      });
    });
  };


  /**
	 * Adds a song to the queue
	 */
  public addSongToQueue = (song: Song) => {
    this._queue.push(song);
  };


  /**
	 * Given a song query, the music player will try to find the song.
	 * @param title the name of the song
	 * @returns the first song result
	 */
  public searchForSong = async (title: string) => {
    let song: Song | void = {} as Song;

    // Check if song is a youtube url
    if (title.startsWith('https://www.youtube.com/watch?v=') || title.startsWith('https://youtu.be/')) {
      song.link = title;

      // Get the video's title given the url
      song.title = (await video_basic_info(title)).video_details.title;
    }
    else if (MusicPlayer.db != null) {

      song = await this.findSongInDB(title);

      // If there was no song found in the database, use the YouTube search API
      if (!song || !song?.title) {
        console.log('Looking for song name on YouTube');
        const songResults = (await search(title, opts)).results;

        // YouTube might return channels too. Only get the first result that is of type video
        const songResult = songResults.find((result: YouTubeSearchResults) => result.kind === 'youtube#video');
        this.cacheSongResults(songResults).then(() => console.log('Cached search results'));
        song = {
          title: songResult?.title,
          link: songResult?.link,
        } as Song;
      }
      else {
        song.link = `https://www.youtube.com/watch?v=${song.videoId}`;
      }
    }

    // If not even YouTube could find that song, don't add to queue.
    if (!song) {
      console.error('Song not found');
      return;
    }

    return song;
  };


  /**
	 * Returns an object containing the validated list id, the number of videos in the playlist,
   * the amount of videos per page, nextPageToken for the API, the first page of videos
	 * @param {string} link
	 */
  public searchForPlaylist = async (link: string) => {
    if (!link) return;
    // Parse the link.
    const queryData = queryString.parse(link.replace(/^.*\?/, ''));

    // If there is not a list key, return.
    if (!queryData.list) return;

    // Form the url for fetching the items in a playlist
    const apiUrl = 'https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails'
                    + '&playlistId=' + queryData.list
                    + `&key=${process.env.YT_API_KEY}`;

    // Make the fetch request
    return fetch(apiUrl)
      .then(res => res.json())
      .then((data: YouTubePlaylistItemResponse) => {
        // The API returns us an error if the playlist does not exist or is private
        if (data.error) return;

        const response = {
          playlistId: queryData.list as string,
          nextPageToken: data.nextpageToken,
          totalVideos: data.pageInfo.totalResults,
          videosPerPage: data.pageInfo.resultsPerPage,
          videoIds:  data.items?.map((item) => item?.contentDetails?.videoId),
        };
        return response;
      })
      .catch(error => console.error(error));
  };

  /**
   * Gets the next songs of the playlist
   * @param playlist the playlist to fetch the next songs for
   */
  public fetchNextSongsFromPlaylist = async (playlist: Playlist) => {

    // Form the API url
    const apiUrl = 'https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails'
      + `&playlistId=${playlist.id}`
      + `&pageToken=${playlist.nextPageToken}`
      + `&key=${process.env.YT_API_KEY}`;

    // Fetch the next page of videos
    fetch(apiUrl)
      .then(res => res.json())
      .then(async (data: YouTubePlaylistItemResponse) => {
        if (data.error) return;

        // Update the next page token
        playlist.nextPageToken = data.nextpageToken;

        // Add each song in the reult
        for (const videoId of data.items) {
          const song = {} as Song;
          song.link = `https://www.youtube.com/watch?v=${videoId}`;
          song.title = (await video_basic_info(song.link)).video_details.title;
          this.addSongToQueue(song);
        }
      })
      .catch(error => console.error(error));
  };


  /**
   * Adds a playlist to the queue
   * @param {Playlist} playlist details about the playlist
   * @param {string[]} firstSongPage the first set of video ids from the playlist (usually 5)
   * @returns whether the playlist videos were added or not
   */
  public addPlaylistToQueue = async (playlist: Playlist, firstSongPage: string[]) => {
    this._playlistsInQueue.set(playlist.id, playlist);

    for (const videoId of firstSongPage) {
      const song = {} as Song;
      song.link = `https://www.youtube.com/watch?v=${videoId}`;
      song.title = (await video_basic_info(song.link)).video_details.title;
      this.addSongToQueue(song);
    }

    return true;
  };


  /**
	 * Console logs every song in the queue. Used for debugging.
	 */
  public printQueue = () => {
    this.queue.forEach(song => {
      console.log(song.title);
    });
  };


  /**
	 * Make the music player join the active voice channel.
	 */
  public joinChannel = async (channelId: string, guildId: string, adapterCreator?: DiscordGatewayAdapterCreator) => {
    if (this.isConnected || !adapterCreator) return;
    this.connection = joinVoiceChannel({
      channelId: channelId,
      guildId: guildId,
      adapterCreator: adapterCreator,
    });
  };


  /**
	 * Joins the channel to start playing music.
	 * @returns
	 */
  public startPlaying = async () => {
    // Otherwise, play the first song in the queue
    this.playNextSong();
    // Error handling if no song was added from the start.
    if (!this.currentSong) {
      console.log('No song to start off with');
      return;
    }

    this.playing = true;
    this.play(this.currentSong);
  };


  /**
	 * Plays song. It is not responsible for freeing the resource beforehand.
	 */
  public play = async (song?: Song) => {
    if (!song || !song.link) return;
    try {
      this.stream = await ytPlayer.stream(song.link, {});
      this.resource = createAudioResource(this.stream.stream, { inputType: this.stream.type });
      this.connection?.subscribe(this._audioPlayer);
      this._audioPlayer.play(this.resource);
      this.playing = true;
    }
    catch (e) {
      console.log('Error: ' + e);
      console.log(song);
    }
  };


  /**
	 * Pauses currently playing song.
	 * @return `true` if it paused it and `false` if it was already paused.
	 */
  public pause = () => {
    if (this.paused) return false;
    this._audioPlayer.pause();
    this.paused = true;
    return true;
  };


  /**
	 * Resumes the currently playing song if not already playing
	 * @returns whether the song was paused or not
	 */
  public unpause = () => {
    // Check if song is playing already
    if (this.paused) {
      this.paused = false;
      this._audioPlayer.unpause();
      return true;
    }
    return false;
  };


  /**
	 * Clears the queue and disconnects from the voice channel if connected
	 */
  public stopPlaying = () => {
    this.clearQueue();
    // Free audio stream
    this._audioPlayer.stop();
    this.playing = false;
    // Leave voice channel only if it connected and it is active
    if (this.isConnected) {
      this.connection?.disconnect();
      this.connection = null;
    }
  };


  /**
	 * Plays next song in the queue
	 * @returns `true` if a song could be played, `false` if there is no song left to play.
	 */
  public playNextSong = () => {
    this.currentSong = this.getNextSong();
    // Whenever the player plays the next song, it is because of 2 scenarios.
    // 1. The current song is finished
    // 2. A user skipped the current song (whether the current song is paused or not)
    // In both cases, we must ensure the musicPlayer is in playing mode (both playing and unpaused)
    this.paused = false;
    // If there is no next song, stop playing.
    if (!this.currentSong) {
      console.log('Queue ended.');
      this.playing = false;
      this.audioPlayer.stop();
      return false;
    }

    // Check if song is part of a playlist
    const playlist = this._playlistsInQueue.get(this.currentSong?.playlistId || '');

    if (playlist) {
      playlist.currentSongIndex++;

      // Check if the playlist is at its end
      if (playlist.currentSongIndex + 1 >= playlist.totalSongs) {
        console.log(`Playlist ${playlist.id} has loaded all its videos`);
        // Remove it from the playlists queue.
        this._playlistsInQueue.delete(playlist.id);
      }
      // Check if it's time to fetch more videos. We do this for the last song in the page
      else if (playlist.autoFetch && (playlist.currentSongIndex + 1) % playlist.videosPerPage == 0) {
        console.info('Fetching more videos from the playlist');
        // Fetch more videos
        this.fetchNextSongsFromPlaylist(playlist);
      }
    }

    this.play(this.currentSong);
    this.playing = true;
    return true;
  };


  /**
	 * Looks for a song stored in the database
	 */
  private findSongInDB = async (title: string) => {

    const sqlQuery = 'SELECT videoId, title FROM songs WHERE title LIKE ? LIMIT 1';
    return new Promise<Song | void>((resolve) => {
      // Sqlite stores the titles in encoded format. For example, the ' character is stored as &#39;
      // The encode function makes sure the query takes that into account
      MusicPlayer.db?.get(sqlQuery, ['%' + encode(title, { decimal:true }) + '%'], (err, row) => {
        if (err) return console.error(err.message);
        if (row) resolve({ ...row } as Song);
        resolve();
      });
    });
  };


  /**
	 * Sets the current song to a song or undefined
	 */
  private set currentSong(song: Song | undefined) {
    this._currentSong = song;
  }


  /**
	 * Returns the currently playing song.
	 */
  get currentSong() {
    return this._currentSong;
  }


  /**
	 * Pops the first song from the queue and returns it. Returns undefined if queue is empty.
	 */
  getNextSong = () => {
    return this._queue.shift();
  };


  /**
	 * Setter method for the playing field
	 * @param playing the state the field should be updated to
	 */
  set playing(playing: boolean) {
    this._playing = playing;
  }


  /**
	 * Getter method for playing field
	 * @returns the playing state of the music player
	 */
  get isPlaying() {
    return this._playing;
  }


  /**
	 * Gets the paused state of the player
	 */
  get paused() {
    return this._paused;
  }


  /**
	 * Sets the paused state of the player
	 */
  set paused(paused: boolean) {
    this._paused = paused;
  }


  /**
	 * Gets the connected state of the player
	 * @return whether the player is connected to a voice channel or not
	 */
  get isConnected(): boolean {
    return !!(this.connection &&
				this.connection.state.status === VoiceConnectionStatus.Ready);
  }


  /**
	 * Returns the music player's current queue
	 * @returns Song[]
	 */
  get queue(): Song[] {
    return this._queue;
  }


  /**
	 * Clears the queue
	 * @return void
	 */
  public clearQueue = (): void => {
    this._queue = [];
  };


  /**
	 * @param position The position of the song in the queue. Guaranteed to be at least 1
	 * @returns Boolean - Whether the music player could skip to that position.
	 */
  public skipTo = (position: number) => {
    const skipCount = position - 1;
    if (skipCount >= this._queue.length) return false;
    if (this.queue.length >= 1) {
      this.queue.splice(0, skipCount);
    }
    this.playNextSong();
    return true;
  };


  /**
	 * @param position The position of the song in the queue. Guaranteed to be at least 1
	 * @returns song or undefined - returns the removed song or nothing.
	 */
  public removeSong = (position: number): Song | undefined => {
    const posIndex = position - 1;
    if (posIndex >= this.queue.length) return;
    return this.queue.splice(posIndex, 1)[0];
  };


  /**
	 * Gets the audio player
	 */
  get audioPlayer() {
    return this._audioPlayer;
  }


  constructor() {
    this._length = 0;
    this._playlistsInQueue = new Map();
    this._audioPlayer = createAudioPlayer();
    this._audioPlayer.on('error', (error: AudioPlayerError) => {
      console.error(`Error: ${error.message}`);
    });
  }
}
