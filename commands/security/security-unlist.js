/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-unlist')
    .setDescription('Scoate utilizator din whitelist/blacklist')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true))
    .addStringOption(option =>
      option.setName('list')
        .setDescription('Lista din care il scoti')
        .setRequired(true)
        .addChoices(
          { name: 'Whitelist', value: 'whitelist' },
          { name: 'Blacklist', value: 'blacklist' }
        )
    ),
  cooldown: 3,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const list = interaction.options.getString('list', true);

    const settings = db.get('security_settings', interaction.guild.id) || {};
    settings[list] = (settings[list] || []).filter(id => id !== user.id);
    settings.updatedAt = Date.now();
    db.set('security_settings', interaction.guild.id, settings);

    return interaction.reply({ content: `<@${user.id}> a fost scos din ${list}.`, flags: MessageFlags.Ephemeral });
  },
};
