/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('phxy-023')
    .setDescription('Batch command ticketing #23'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-023] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
