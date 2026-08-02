/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('phxy-007')
    .setDescription('Batch command voice #7'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-007] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
