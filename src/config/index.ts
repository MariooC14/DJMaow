/**
 * Sets up the necessary configuration.
 * Requirements:
 * - Prompt the user for the .env file location
 * - Go through each environment variable required.
 * - If a variable is missing, tell the user so.
 * - Parse config file. We shall call it 'maow_config.json'
 * - if file does not exist
 *   - create an empty config file.
 *   - ask the user if they want to enable caching
 *   - if yes
 *      - prompt the user for the database path to use
 *      - check if the sql file exists
 *      - if it does exist
 *        - check if you can access it (fs.access()), tell user if not
 *      - If it does not exist
 *        - create the file using the songsDBSchema.sql
 *        - create the music player with the args
 *   - if not
 *      - continue creating the music player with no args
 */
import * as fs from 'fs';
import { MAOW_CONFIG_PATH, createMaowConfigFile, validateVars } from './helpers';
import { MusicPlayer } from '../musicPlayer';


export async function createMusicPlayer() {
  if (!validateVars()) process.exit(1);
  let config: any;
  try {
    config = JSON.parse(fs.readFileSync(MAOW_CONFIG_PATH, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      await createMaowConfigFile();
      config = fs.readFileSync(MAOW_CONFIG_PATH, 'utf8');
    }
  }

  if (!config) {
    // Create a music player without caching
    console.warn('WARNING: No config file found. Caching will not be used');
    return new MusicPlayer(false, '');
  };
  // if the config file specifies caching enabled but did not provide a database path, disable caching
  if (config['dbPath'] === '') {
    config['cachingEnabled'] = null;
  }

  return new MusicPlayer(config['cachingEnabled'], config['dbPath']);
}
