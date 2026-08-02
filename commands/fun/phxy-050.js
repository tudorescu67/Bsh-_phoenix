/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'fun',
  data: new SlashCommandBuilder()
    .setName('phxy-050')
    .setDescription('Batch command fun #50'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-050] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
