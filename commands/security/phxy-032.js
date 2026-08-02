/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('phxy-032')
    .setDescription('Batch command security #32'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-032] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
