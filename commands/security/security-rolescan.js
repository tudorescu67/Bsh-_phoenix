/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

const SENSITIVE_PERMS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageWebhooks,
];

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-rolescan')
    .setDescription('Arata rolurile cu permisiuni sensibile')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 6,
  async execute(interaction) {
    const roles = interaction.guild.roles.cache
      .filter(role => role.id !== interaction.guild.id)
      .map(role => {
        const hits = SENSITIVE_PERMS.filter(flag => role.permissions.has(flag));
        return { role, hits };
      })
      .filter(item => item.hits.length > 0)
      .sort((a, b) => b.role.position - a.role.position)
      .slice(0, 20);

    if (!roles.length) {
      return interaction.reply({ content: 'Nu am gasit roluri cu permisiuni sensibile.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle('Role Scan - Permisiuni Sensibile')
      .setDescription(roles.map(item => `• ${item.role} - ${item.hits.length} permisiuni sensibile`).join('\n'))
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
