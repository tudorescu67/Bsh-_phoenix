/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('phxy-005')
    .setDescription('Batch command utility #5'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-005] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
