/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('phxy-044')
    .setDescription('Batch command community #44'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-044] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
