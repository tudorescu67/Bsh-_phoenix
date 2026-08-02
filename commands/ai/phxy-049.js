/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('phxy-049')
    .setDescription('Batch command ai #49'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-049] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
