  import { SlashCommandBuilder, CommandInteraction } from "discord.js";
  import { musicPlayer } from "../../main";
  
  export const resumeCommand = {
    command: new SlashCommandBuilder().setName('resume').setDescription('Resume the current song'),
    async execute(interaction: CommandInteraction) {
      musicPlayer.unpause();
      await interaction.reply('Resumed current song');
    }
  }