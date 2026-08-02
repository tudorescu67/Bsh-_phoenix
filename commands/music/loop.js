/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const mm = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder().setName('loop').setDescription('Activeaza/dezactiveaza loop pe melodia curenta'),
  cooldown: 2,
  async execute(interaction) {
    const q = mm.getQueueData(interaction.guild.id);
    if (!q) return interaction.reply({ content: '❌ Nu se reda nimic.', flags: MessageFlags.Ephemeral });
    const newVal = !q.looping;
    mm.setLoop(interaction.guild.id, newVal);
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setDescription(`🔁 Loop **${newVal ? 'activat' : 'dezactivat'}**.`)] });
  },
};
