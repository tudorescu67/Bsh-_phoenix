/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('phxy-041')
    .setDescription('Batch command music #41'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-041] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
