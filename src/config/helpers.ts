import * as readline from 'readline';
import { config } from 'dotenv';
import * as fs from 'node:fs';
import * as sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
config();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query: string) => new Promise(resolve => rl.question(query, resolve));
export const MAOW_CONFIG_PATH = './maowconfig.json';

/**
 * Gets a yes or no answer from stdin
 * @param {string} input
 * @return {Promise<boolean>}
 */
export async function getYesOrNo(input: string) {
  while (true) {
    const answer = await prompt(input);
    if (typeof answer === 'string') {
      if (['y', 'yes'].includes(answer.toLowerCase())) {
        return true;
      }
      else if (['n', 'no'].includes(answer.toLowerCase())) {
        return false;
      }
      else {
        console.log('Please answer (y/n)');
      }
    }
  }
}

/**
 * @param {string} input
 * @return {Promise<string>}
 */
export async function getString(input: string): Promise<string> {
  let answer;
  while (typeof answer !== 'string') {
    answer = await prompt(input);
  }
  return answer;
}

/**
 * @return {boolean} whether the environment variables are valid
 */
export function validateVars(): boolean {
  let validVars = true;
  console.log('Checking environment variables');
  if (!process.env.SECRET) {
    console.error('ERROR: SECRET key missing.');
    validVars = false;
  }
  if (!process.env.APP_ID) {
    console.error('ERROR: APP_ID missing.');
    validVars = false;
  }
  if (!process.env.PUBLIC_KEY) {
    console.error('ERROR: PUBLIC_KEY missing.');
    validVars = false;
  }
  if (!process.env.GUILD_ID) {
    console.error('ERROR: GUILD_ID missing.');
    validVars = false;
  }
  if (!process.env.YT_API_KEY) {
    console.error('ERROR: YT_API_KEY missing.');
    validVars = false;
  }
  if (!process.env.YT_ID_COOKIE) {
    console.warn('WARNING: YT_ID_COOKIE missing. You may not be able to play explicit YT content');
  }
  if (!process.env.DavidID) {
    process.env.DavidID = '335715508731117568';
  }

  if (!validVars) {
    console.error('ERROR: One or more environment variables are missing. ');
  }
  return validVars;
}

export async function createMaowConfigFile() {
  console.log('Creating your configuration file...');
  const newConfig = {
    cachingEnabled: false,
    dbPath: '',
  };

  newConfig.cachingEnabled = await getYesOrNo('Caching is a feature that allows you to store search results locally, to minimize requests to providers. It also helps ' +
    'with speed. This requires a database which will be created for you.\nEnable Caching? ');

  if (newConfig.cachingEnabled) {
    let dbPath = await getString('Enter database path: ');
    if (dbPath === '') {
      dbPath = './songs.db';
    }

    // Check for existing file at path specified
    if (fs.existsSync(dbPath)) {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('Error opening old database.', err);
        }
      });
        // Check if existing database works by running a sample query
      const success = await testDB(db);
      if (success) {
        newConfig.dbPath = dbPath;
      }
      else {
        console.error('Database exists but seems to be invalid');
      }
    }
    else {
      await createDB(dbPath);
    }

    // fs.readFile(dbPath, async (err) => {
    //   // If database file does not exist, create it.
    //   if (err && err.code === 'ENOENT') {
    //     await createDB(dbPath);
    //   }
    //   else {
    //     // Test if the database works by running a sample query
    //     console.log('Existing database found. Testing');
    //     const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    //       if (err) {
    //         console.error('Error opening old database.', err);
    //       }
    //     });
    //     // Check if existing database works by running a sample query
    //     const success = await testDB(db);
    //     if (success) {
    //       newConfig.dbPath = dbPath;
    //     }
    //     else {
    //       console.error('Database exists but seems to be invalid');
    //     }

    //     // Handle database not working
    //   }
    // });
  }

  // Write the configuration to file as a promise
  return new Promise<boolean>(resolve => {
    fs.writeFile(MAOW_CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8', err => {
      if (err) {
        console.error(err);
        resolve(false);
      }
      else {
        console.log('file written successfully');
        resolve(true);
      }
    });
  });
}

/**
 * Creates a sqlite database for caching song results.
 * @param {string} path
 */
async function createDB(path: string) {
  console.log('Creating database');
  const newDb = new sqlite3.Database(path, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) console.error(err);
  });

  // Read the table definition file and execute it on the new database
  fs.readFile('src/config/songsDbSchema.sql', (err, tableQuery) => {
    if (err) {
      console.error('Error reading songsDbSchema.sql');
      console.error(err);
    }
    newDb.exec(tableQuery.toString());
    console.log('Database created');
    newDb.close();
  });
}

/**
 * Tests that the songs db works by running a sample read query.
 * @param db the sqlite3 database
 * @return whether the query worked
 */
async function testDB(db: Database) {
  const query = 'SELECT videoId, title FROM songs WHERE title LIKE "test" LIMIT 1';

  return new Promise<boolean>((resolve) => {
    db.all(query, (err, row) => {
      if (err) {
        console.error('Error testing existing database', err.message);
        resolve(false);
      }
      if (row) {
        resolve(true);
      }
    });
  });
}
