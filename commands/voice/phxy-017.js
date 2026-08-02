/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('phxy-017')
    .setDescription('Batch command voice #17'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-017] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
