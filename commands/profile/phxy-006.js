/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('phxy-006')
    .setDescription('Batch command profile #6'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-006] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
