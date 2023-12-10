import { Command } from "../../types";
import { config } from "dotenv";
config();
import { SlashCommandBuilder } from "discord.js";
import { musicPlayer } from "../../main";

const DavidID = process.env.DavidID;

export const fuckYouDavidCommand: Command = {
    command: new SlashCommandBuilder().setName('fuckyoudavid').setDescription(`Fuck you David`),
    async execute(interaction: any) {
      const voiceChannel = interaction.member.voice.channel;
      await interaction.reply(`Fuck you <@${DavidID}>`);
      // Join the channel the suer is in and start playing the best song for David.
      if (voiceChannel) {
        if (!musicPlayer.isConnected) {
          await musicPlayer.addToQueue('DEMARKUS MCCLURE- FUCK YOU DAVID');
          await musicPlayer.joinChannel(voiceChannel.id, interaction.guildId, interaction.guild.voiceAdapterCreator);
          await musicPlayer.startPlaying();
        }
      }
    }
  }