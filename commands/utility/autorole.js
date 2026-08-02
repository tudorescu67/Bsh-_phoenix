/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Rol automat la join')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName('set').setDescription('Seteaza rolul automat la join')
      .addRoleOption(o => o.setName('rol').setDescription('Rolul').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Elimina autorole'))
    .addSubcommand(s => s.setName('info').setDescription('Informatii autorole')),
  cooldown: 5,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'set') {
      const rol = interaction.options.getRole('rol');
      if (!rol.editable) return interaction.reply({ content: '❌ Botul nu poate da acest rol (pozitie ierarhica).', flags: MessageFlags.Ephemeral });
      db.set('autorole', interaction.guild.id, rol.id);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`✅ Autorole setat: ${rol}\nToti membrii noi vor primi automat acest rol.`)] });
    }
    if (sub === 'remove') {
      db.del('autorole', interaction.guild.id);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription('✅ Autorole dezactivat.')] });
    }
    if (sub === 'info') {
      const roleId = db.get('autorole', interaction.guild.id);
      if (!roleId) return interaction.reply({ content: 'ℹ️ Autorole nu este configurat.', flags: MessageFlags.Ephemeral });
      const role = interaction.guild.roles.cache.get(roleId);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setDescription(`🎭 Autorole curent: ${role ?? `ID necunoscut: ${roleId}`}`)] });
    }
  },
};
