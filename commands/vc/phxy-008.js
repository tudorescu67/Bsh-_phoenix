/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'vc',
  data: new SlashCommandBuilder()
    .setName('phxy-008')
    .setDescription('Batch command vc #8'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-008] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
