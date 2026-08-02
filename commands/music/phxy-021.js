/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('phxy-021')
    .setDescription('Batch command music #21'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-021] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
