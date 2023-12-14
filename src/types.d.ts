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
  url: string | undefined
}

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, SlashCommand>
        // cooldowns: Collection<string, number>
    }
}
