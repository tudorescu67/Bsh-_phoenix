/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'vc',
  data: new SlashCommandBuilder()
    .setName('phxy-018')
    .setDescription('Batch command vc #18'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-018] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
