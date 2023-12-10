# DJ Maow
This is Mario's amazing discord music bot. Better than Dave Bot!

# Current Features
* `/play <song: string>` to play a song. Plays the first result on youtube
* `/play` to resume the current song.
* `/skip` to skip the currently playing song.
* `/pause` to pause the current song.
* `/resume` to unpause the current song.
* `/stop` to end the whole queue and make DJMaow leave.
* `/queue` to show the queue.
* `/fuckYouDavid` cause fuck you david.

# Development
To start working on the bot, run the following commands.

`npm install`

`tsc`

`npm run dev`


# Adding new commands
To add new commands to the bot, create your command and add it to `registeredCommands` in `commands/commands.ts`.
Then run

`tsc`,
 and

`npm run deploy-commands`