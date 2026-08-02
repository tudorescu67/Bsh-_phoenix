/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-audit')
    .setDescription('Rezumat rapid al setarilor de securitate')
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),
  cooldown: 4,
  async execute(interaction) {
    const settings = db.get('security_settings', interaction.guild.id) || {};
    const reports = db.getAll('community_reports') || {};

    const recentReports = Object.values(reports)
      .filter(row => row.guildId === interaction.guild.id)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor(0x34495e)
      .setTitle('Security Audit Snapshot')
      .addFields(
        { name: 'Antispam', value: settings.antispamEnabled ? 'Activ' : 'Inactiv', inline: true },
        { name: 'Lockdown', value: settings.lockdown ? 'Activ' : 'Inactiv', inline: true },
        { name: 'Whitelist', value: String((settings.whitelist || []).length), inline: true },
        { name: 'Blacklist', value: String((settings.blacklist || []).length), inline: true },
        {
          name: 'Ultimele reporturi',
          value: recentReports.length
            ? recentReports.map((row, idx) => `${idx + 1}. <@${row.targetId}> (${row.reason.slice(0, 60)})`).join('\n')
            : 'Nu exista reporturi recente.'
        }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
