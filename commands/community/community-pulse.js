/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-pulse')
    .setDescription('Rezumat rapid al statusului comunitatii'),
  cooldown: 5,
  async execute(interaction) {
    const now = Date.now();
    const reports = Object.values(db.getAll('community_reports') || {})
      .filter(item => item.guildId === interaction.guild.id);
    const recentReports = reports.filter(item => now - item.createdAt <= 24 * 60 * 60 * 1000).length;

    const feedback = Object.values(db.getAll('community_feedback') || {})
      .filter(item => item.guildId === interaction.guild.id);
    const recentFeedback = feedback.filter(item => now - item.createdAt <= 24 * 60 * 60 * 1000).length;

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('Community pulse')
      .addFields(
        { name: 'Reports (24h)', value: String(recentReports), inline: true },
        { name: 'Feedback (24h)', value: String(recentFeedback), inline: true },
        { name: 'Status', value: recentReports > 5 ? 'Atentie ridicata pe moderare.' : 'Flux stabil in ultimele 24h.' }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
