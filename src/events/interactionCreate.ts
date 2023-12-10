import { BotEvent } from "../types";
import { Interaction } from "discord.js";

const piggyJohnId = '417381385603383296';

export const interactionHandler: BotEvent = {
  name: 'interactionCreate',
  execute: async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}`);
      console.error(error);
      await interaction.reply("I don't respond to that command chief")
    }
  },
};
