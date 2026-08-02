/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'vc',
  data: new SlashCommandBuilder()
    .setName('phxy-038')
    .setDescription('Batch command vc #38'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-038] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
