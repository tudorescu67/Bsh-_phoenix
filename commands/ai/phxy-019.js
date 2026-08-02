/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('phxy-019')
    .setDescription('Batch command ai #19'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-019] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
