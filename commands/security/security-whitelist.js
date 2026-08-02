/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-whitelist')
    .setDescription('Adauga un utilizator in whitelist')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true)),
  cooldown: 3,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const settings = db.get('security_settings', interaction.guild.id) || {};
    settings.whitelist = Array.from(new Set([...(settings.whitelist || []), user.id]));
    settings.updatedAt = Date.now();
    db.set('security_settings', interaction.guild.id, settings);

    return interaction.reply({ content: `<@${user.id}> a fost adaugat in whitelist.`, flags: MessageFlags.Ephemeral });
  },
};
