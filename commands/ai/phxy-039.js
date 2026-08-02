/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('phxy-039')
    .setDescription('Batch command ai #39'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-039] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
