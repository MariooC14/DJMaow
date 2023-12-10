import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export interface Command {
  command: | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">
           | SlashCommandSubcommandsOnlyBuilder,
  execute: (interaction: ChatInputCommandInteraction) => void,
  autocomplete?: (interaction: AutocompleteInteraction) => void,
  cooldown?: number // in seconds
}

export interface BotEvent {
  name: string,
  once?: boolean | false,
  execute: (...args?) => void
}

export interface song {
  kind?: "youtube#channel" | "youtube#video",
  title?: string,
  videoId: string,
  url: string | undefined
}

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, SlashCommand>
        // cooldowns: Collection<string, number>
    }
}