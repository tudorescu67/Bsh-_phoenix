/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('phxy-037')
    .setDescription('Batch command voice #37'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-037] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
