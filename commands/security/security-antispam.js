/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-antispam')
    .setDescription('Configureaza pragul antispam')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addBooleanOption(option => option.setName('enabled').setDescription('Activ/Inactiv').setRequired(true))
    .addIntegerOption(option => option.setName('max').setDescription('Max mesaje per 10 sec').setRequired(false).setMinValue(3).setMaxValue(30)),
  cooldown: 3,
  async execute(interaction) {
    const enabled = interaction.options.getBoolean('enabled', true);
    const max = interaction.options.getInteger('max') || 8;

    const settings = db.get('security_settings', interaction.guild.id) || {};
    settings.antispamEnabled = enabled;
    settings.antispamMax = max;
    settings.updatedAt = Date.now();
    db.set('security_settings', interaction.guild.id, settings);

    return interaction.reply({ content: `Antispam ${enabled ? 'activat' : 'dezactivat'} cu prag ${max}/10s.`, flags: MessageFlags.Ephemeral });
  },
};
