/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('phxy-047')
    .setDescription('Batch command voice #47'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-047] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
