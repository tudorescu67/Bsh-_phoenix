/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('phxy-009')
    .setDescription('Batch command ai #9'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-009] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
