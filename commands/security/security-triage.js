/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

function scoreIncident(item) {
  const txt = `${item.title || ''} ${item.details || ''}`.toLowerCase();
  let score = 0;
  if (txt.includes('raid')) score += 3;
  if (txt.includes('nuke')) score += 4;
  if (txt.includes('spam')) score += 2;
  if (txt.includes('token')) score += 4;
  return score;
}

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-triage')
    .setDescription('Prioritizeaza incidentele logate')
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),
  cooldown: 4,
  async execute(interaction) {
    const incidents = Object.values(db.getAll('security_incidents') || {})
      .filter((item) => item.guildId === interaction.guild.id)
      .map((item) => ({ ...item, risk: scoreIncident(item) }))
      .sort((a, b) => b.risk - a.risk || (b.at || 0) - (a.at || 0))
      .slice(0, 10);

    if (!incidents.length) {
      return interaction.reply({ content: 'Nu exista incidente pentru triage.', flags: MessageFlags.Ephemeral });
    }

    const text = incidents.map((item, index) => `${index + 1}. [risc ${item.risk}] ${item.title} | <t:${Math.floor(item.at / 1000)}:R>`).join('\n');
    const embed = new EmbedBuilder().setColor(0xe67e22).setTitle('Security triage').setDescription(text).setTimestamp();
    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
