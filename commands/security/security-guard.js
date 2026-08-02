/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-guard')
    .setDescription('Comuta guard mode pentru server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(option => option.setName('enabled').setDescription('true/false').setRequired(true)),
  cooldown: 3,
  async execute(interaction) {
    const enabled = interaction.options.getBoolean('enabled', true);
    const settings = db.get('security_settings', interaction.guild.id) || {};
    settings.guardMode = enabled;
    settings.updatedAt = Date.now();
    db.set('security_settings', interaction.guild.id, settings);

    return interaction.reply({ content: `Guard mode ${enabled ? 'activat' : 'dezactivat'}.`, flags: MessageFlags.Ephemeral });
  },
};
