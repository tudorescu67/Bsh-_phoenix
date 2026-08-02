/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('phxy-042')
    .setDescription('Batch command security #42'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-042] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
