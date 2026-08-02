/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const mm = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Sari peste melodia curentă'),

  async execute(interaction) {
    const q = mm.getQueueData(interaction.guild.id);
    if (!q || !q.current) return interaction.reply({ content: '❌ Nu am ce să sar!', flags: MessageFlags.Ephemeral });

    mm.skip(interaction.guild.id);
    await interaction.reply({ content: '⏭️ Am sărit peste melodie!' });
  },
};
