/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('phxy-046')
    .setDescription('Batch command profile #46'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-046] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
