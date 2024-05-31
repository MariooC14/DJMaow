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
import { Song } from './types';
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
  private _currentSong: Song| undefined;
  private _length: number;
  private _playing: boolean = false;
  private _paused: boolean = false;
  private _audioPlayer: AudioPlayer;
  private stream: YouTubeStream | undefined;
  private connection: VoiceConnection | null | undefined;
  private resource: AudioResource | undefined;
  private db: sqlite3.Database | null;
  private cachingEnabled = false;

  /**
	 * Stores the YouTube Search Results into the database if the database exists
	 */
  private cacheSongResults = async (songs: YouTubeSearchResults[]) => {
    if (!this.db || !this.cachingEnabled) return;
    const sqlQuery = 'INSERT OR IGNORE INTO songs (title, videoId) VALUES (?, ?)';
    songs.forEach((song: YouTubeSearchResults) => {
      this.db?.run(sqlQuery, [song.title, song.id], (err) => {
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

    // Check if song is a YouTube url
    if (title.startsWith('https://www.youtube.com/watch?v=') || title.startsWith('https://youtu.be/')) {
      song.url = title;

      // Get the video's title given the url
      song.title = (await video_basic_info(title)).video_details.title;
    }
    else if (this.db != null) {
      song = await this.findSongInDB(title);

      // If there was no song found in the database, use the YouTube search API
      if (!song || !song?.title) {
        console.log('Looking for song on YouTube');

        const ytSearchResults = await this.getSongsFromYouTube(title);
        const topMatch = ytSearchResults[0];
        this.cacheSongResults(ytSearchResults);
        song = { title: topMatch?.title, url: topMatch?.link } as Song;
      }
      else {
        song.url = `https://www.youtube.com/watch?v=${song.videoId}`;
      }
    }
    // If caching is disabled, search youtube for the song
    else {
      const ytSearchResults = await this.getSongsFromYouTube(title);
      const topMatch = ytSearchResults[0];
      song = { title: topMatch?.title, url: topMatch?.link } as Song;
    }

    // If not even YouTube could find that song, don't add to queue.
    if (!song) {
      console.error('Song not found');
      return;
    }

    return song;
  };

  /**
   * Returns the top few search results from YouTube
   * @param title The name to search for
   * @returns Array of songs
   */
  private async getSongsFromYouTube(title: string) {
    const results = (await search(title, opts)).results;
    // YouTube returns channels too. Only return the video results.
    return results.filter((result: YouTubeSearchResults) => result.kind === 'youtube#video');
  }


  // TODO: Use nextPageToken to load the next songs in the playlist on command

  /**
	 * Returns a list of the video ids in the playlist
	 * @param {string} link
	 */
  public searchForPlaylist = async (link: string) => {
    if (!link) return;
    // Parse the link.
    const queryData = queryString.parse(link.replace(/^.*\?/, ''));

    // If there is not a list key, return.
    if (!queryData.list) return;

    // Form the url for fetching the items in a playlist
    const apiUrl = 'https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId='
				+ queryData['list']
				+ `&key=${process.env.YT_API_KEY}`;

    return fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        // The API returns us an error if the playlist does not exist or is private
        if (data.error) return;

        // TODO: Change this so the function returns the nextPageToken in the future
        const videoIds: string[] = data.items?.map((item: any) => {
          return item?.contentDetails?.videoId;
        });
        return videoIds;
      })
      .catch(error => console.error(error));
  };


  /**
	 * Adds a playlist to the queue
	 * @returns whether the playlist videos were added or not
	 */
  public addPlaylistToQueue = async (link: string) => {
    const videoIds = await this.searchForPlaylist(link);
    if (!videoIds) return false;

    for (const videoId of videoIds) {
      const song = {} as Song;
      song.url = `https://www.youtube.com/watch?v=${videoId}`;
      song.title = (await video_basic_info(song.url)).video_details.title;
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
    if (!song || !song.url) return;
    try {
      this.stream = await ytPlayer.stream(song.url, {});
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
      this.db?.get(sqlQuery, ['%' + encode(title, { decimal:true }) + '%'], (err, row) => {
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

  /**
   * Initiates the music player.
   * If a database path is provided and caching is enabled, the player will cache song in the database
   * It does not check if the db_path exists
   * @param cachingEnabled
   * @param db_path
   */
  constructor(cachingEnabled: boolean, db_path?: string) {
    this._length = 0;
    if (cachingEnabled && db_path) {
      // Only one instance of the DBMS is created between all discord servers
      this.db = new sqlite3.Database(
        db_path,
        sqlite3.OPEN_READWRITE,
        (err) => {
          if (err) {
            console.error(err.message);
            this.db = null;
          }
          console.log('connected to the songs db');
        },
      );
    }
    else {
      this.db = null;
    }

    this._audioPlayer = createAudioPlayer();
    this._audioPlayer.on('error', (error: AudioPlayerError) => {
      console.error(`Error: ${error.message}`);
    });
  }
}
