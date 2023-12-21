import { config } from 'dotenv';
config();
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { MusicPlayer } from './musicPlayer';
import { registeredCommands } from './commands';
import { AudioPlayerState } from '@discordjs/voice';
import { interactionHandler } from './events/interactionCreate';

// TODO: Add multi-server support?
const seconds = 1000;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
export const musicPlayer = new MusicPlayer();
client.commands = new Collection();

// Load every command into the bot
registeredCommands?.forEach((command) => {
  client.commands.set(command.command.name, command);
  console.log(`Loaded ${command.command.name}`);
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user?.tag}`);
});

client.on(interactionHandler.name, (...args) => interactionHandler.execute(...args));

// Listen for when songs finish.
musicPlayer.audioPlayer.addListener('stateChange', (oldState: AudioPlayerState, newState: AudioPlayerState) => {
  if (newState.status === 'idle') {
    // Try play the next song or leave
    console.log('Playing next song in the queue.');
    if (!musicPlayer.playNextSong()) {
      // If no song is playing
      console.log('Waiting for users to add song');
      setTimeout(() => {
        if (!musicPlayer.isPlaying) {
          console.log('Left the channel due to inactivity');
          musicPlayer.stopPlaying();
        }
        else {
          console.log('Looks like I\'m still playing. I\'ll stay on.');
        }
      }, 15 * seconds);
    }
  }
});

client.login(process.env.SECRET);
