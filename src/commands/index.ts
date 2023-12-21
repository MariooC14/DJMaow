import { Command } from '../types';
import { playCommand } from './music/play';
import { pauseCommand } from './music/pause';
import { resumeCommand } from './music/resume';
import { skipCommand } from './music/skip';
import { stopPlayingCommand } from './music/stop';
import { showQueueCommand } from './music/showQueue';
import { clearQueueCommand } from './music/clearQueue';
import { fuckYouDavidCommand } from './music/fuckYouDavid';
import { skipToCommand } from './music/skipTo';
import { removeSongCommand } from './music/removeSong';
import { helpCommand } from './music/help';
import { feedbackCommand } from './general/feedback';

export const registeredCommands: Command[] = [
  playCommand,
  pauseCommand,
  resumeCommand,
  skipCommand,
  stopPlayingCommand,
  showQueueCommand,
  clearQueueCommand,
  skipToCommand,
  removeSongCommand,
  fuckYouDavidCommand,
  helpCommand,
  feedbackCommand,
];
