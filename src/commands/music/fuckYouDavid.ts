import { Command } from "../../types";
import { config } from "dotenv";
config();
import { SlashCommandBuilder } from "discord.js";
import { musicPlayer } from "../../main";

const DavidID = 335715508731117568n;
const DavidId = process.env.DavidID; // TODO: Put Daivd's id in the env file

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