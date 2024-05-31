# DJ MAOW

## V1.5 - Help Command

### Features
* `/help` will give you an overview of all the commands DJ Maow supports
* `/help <command>` will give you details on how to use a command

### Bug fixes
* Using `/play` when there is no song playing no longer causes DJ Maow to search for a song called "undefined".

# V1.4.1 - Channel Permissions Fix

## Bug Fixes
* DJ Maow will tell you if it could not join the voice channel due to permissions, e.g. private channels

## V1.4 - Play By YouTube Link Support

### Features
* `/play` can now directly play youtube link. Simply paste your link into the 'song' parameter
* Piggy John can no longer use any commands

## V1.3 - skipTo and removeSong

### Features:
* `/skipTo <int: position>` will let you play a song at a specified index, removing any songs beforehand.
* `/remove <int:position>` will remove a song at a specified position if the position is valid
* Smarter song caching that includes searching for songs that have special characters in their title.

### Bug Fixes:
* Using `/skip` will no longer skip 2 songs ahead.

## V1.2 - Transition to Typescript
This transition was made to future proof the security of the bot. By including type checking in the codebase
we increase the reliability of the bot.

### Bug Fixes:
* Playing age restricted songs should no longer cause the bot to crash.
* Unpause command will now cause the bot to resume the current song.

## V1.1 - Minor patches
### Bug Fixes:
* Searching for a song using the creator's name will no longer cause the bot to crash.

Known Bugs:
* Playing age restricted songs/videos will cause the bot to crash.


## V1.0 - First release
Initial Release of bot
### Features:
* `/play <song: string>` to play a song. Plays the first result on youtube
* `/play` to resume the current song. Uses the `/pause` command.
* `/skip` to skip the current playing song.
* `/pause` to pause the current song.
* `/resume` to unpause the current song.

### Known Bugs:
* Playing an age restricted song/vdieo will cause the bot to crash.
* Searching for a song by using just the creator's name will cause the bot to crash