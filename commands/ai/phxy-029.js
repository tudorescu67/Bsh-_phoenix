/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('phxy-029')
    .setDescription('Batch command ai #29'),
  cooldown: 3,
  async execute(interaction) {
    return interaction.reply({
      content: '[phxy-029] comanda activa in batchul de scalare 250.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
