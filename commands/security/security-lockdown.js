/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-lockdown')
    .setDescription('Activeaza/dezactiveaza lockdown pe canalele text')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(option => option.setName('enabled').setDescription('true/false').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Motiv').setRequired(false).setMaxLength(150)),
  cooldown: 5,
  async execute(interaction) {
    const enabled = interaction.options.getBoolean('enabled', true);
    const reason = interaction.options.getString('reason') || 'Lockdown securitate';
    const everyone = interaction.guild.roles.everyone.id;

    const textChannels = interaction.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
    let changed = 0;

    for (const ch of textChannels.values()) {
      await ch.permissionOverwrites.edit(everyone, { SendMessages: enabled ? false : null }, { reason: `${reason} | by ${interaction.user.tag}` });
      changed += 1;
    }

    const settings = db.get('security_settings', interaction.guild.id) || {};
    settings.lockdown = enabled;
    settings.updatedAt = Date.now();
    db.set('security_settings', interaction.guild.id, settings);

    return interaction.reply({ content: `Lockdown ${enabled ? 'activat' : 'dezactivat'} pe ${changed} canale.`, flags: MessageFlags.Ephemeral });
  },
};
