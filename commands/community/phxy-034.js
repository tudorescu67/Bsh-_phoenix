/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('phxy-034')
    .setDescription('Batch command community #34'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-034] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
