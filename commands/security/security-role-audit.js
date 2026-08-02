/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-role-audit')
    .setDescription('Audit pe roluri cu permisiuni sensibile')
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),
  cooldown: 4,
  async execute(interaction) {
    const roles = [...interaction.guild.roles.cache.values()].filter((role) => role.id !== interaction.guild.id);
    const risky = roles.filter((role) =>
      role.permissions.has(PermissionFlagsBits.Administrator) ||
      role.permissions.has(PermissionFlagsBits.ManageGuild) ||
      role.permissions.has(PermissionFlagsBits.BanMembers)
    );

    const lines = risky.slice(0, 15).map((role, index) => `${index + 1}. ${role} | members: ${role.members.size}`);

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle('Security role audit')
      .addFields(
        { name: 'Roluri totale', value: String(roles.length), inline: true },
        { name: 'Roluri risc ridicat', value: String(risky.length), inline: true },
        { name: 'Preview', value: lines.length ? lines.join('\n') : 'Niciun rol critic detectat.' }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
