/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('phxy-031')
    .setDescription('Batch command music #31'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-031] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
