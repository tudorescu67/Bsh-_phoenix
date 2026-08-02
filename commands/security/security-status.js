/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-status')
    .setDescription('Afiseaza statusul securitatii serverului')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 3,
  async execute(interaction) {
    const settings = db.get('security_settings', interaction.guild.id) || {};

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('Security Status')
      .addFields(
        { name: 'Antispam', value: settings.antispamEnabled ? 'Activ' : 'Inactiv', inline: true },
        { name: 'Lockdown', value: settings.lockdown ? 'Activ' : 'Inactiv', inline: true },
        { name: 'Whitelist users', value: String((settings.whitelist || []).length), inline: true },
        { name: 'Blacklist users', value: String((settings.blacklist || []).length), inline: true },
        { name: 'Ultim update', value: settings.updatedAt ? `<t:${Math.floor(settings.updatedAt / 1000)}:R>` : 'N/A', inline: false }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
