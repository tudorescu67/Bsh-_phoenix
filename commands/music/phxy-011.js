/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('phxy-011')
    .setDescription('Batch command music #11'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-011] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
