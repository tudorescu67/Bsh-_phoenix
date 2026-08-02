/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('phxy-045')
    .setDescription('Batch command utility #45'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-045] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
