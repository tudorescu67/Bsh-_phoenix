/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-snapshot')
    .setDescription('Snapshot rapid pe setarile security')
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),
  cooldown: 4,
  async execute(interaction) {
    const settings = db.get('security_settings', interaction.guild.id) || {};
    const incidents = Object.values(db.getAll('security_incidents') || {})
      .filter((item) => item.guildId === interaction.guild.id)
      .length;
    const trust = Object.values(db.getAll('security_trust_scores') || {})
      .filter((item) => item?.score !== undefined)
      .length;

    const embed = new EmbedBuilder()
      .setColor(0x34495e)
      .setTitle('Security snapshot')
      .addFields(
        { name: 'Guard mode', value: settings.guardMode ? 'Activ' : 'Inactiv', inline: true },
        { name: 'Whitelist', value: String((settings.whitelist || []).length), inline: true },
        { name: 'Blacklist', value: String((settings.blacklist || []).length), inline: true },
        { name: 'Incidente logate', value: String(incidents), inline: true },
        { name: 'Trust scores', value: String(trust), inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
