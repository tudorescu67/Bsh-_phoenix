/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('phxy-027')
    .setDescription('Batch command voice #27'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-027] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
