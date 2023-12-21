import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import sqlite3 from 'sqlite3';

const sqlQuery = 'INSERT INTO feedback (userId, message) VALUES (?, ?)';

export const feedbackCommand: Command = {
  command: new SlashCommandBuilder().setName('feedback').setDescription('Provide feedback to the developers')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The feedback message')
        .setRequired(true),
    ),
  execute: async (interaction) => {

    // Open a database connection
    const db = new sqlite3.Database(
      process.env.DB_PATH || '',
      sqlite3.OPEN_READWRITE,
      (err) => {
        if (err) {
          console.error('Error:', err?.message);
        }
      },
    );

    if (!db) return await interaction.reply('There seems to be a problem on our end (ironic isn\'t it).');

    // Get the user's id and feedback message
    const userId = interaction.user.id;
    const message = String(interaction.options.get('message')?.value);

    // Execute the query to store the feedback
    db.run(sqlQuery, [userId, message], err => {
      if (err) console.error('Error:', err?.message);
    });

    // Close the connection to the database
    db.close();

    await interaction.reply('Thank you for your feedback');
  },
};