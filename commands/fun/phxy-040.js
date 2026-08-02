/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'fun',
  data: new SlashCommandBuilder()
    .setName('phxy-040')
    .setDescription('Batch command fun #40'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-040] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
