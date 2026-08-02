/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('phxy-025')
    .setDescription('Batch command utility #25'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-025] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
