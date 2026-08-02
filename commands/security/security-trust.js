/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-trust')
    .setDescription('Seteaza trust score manual pentru un user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true))
    .addIntegerOption(option => option.setName('score').setDescription('0-100').setRequired(true).setMinValue(0).setMaxValue(100)),
  cooldown: 3,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const score = interaction.options.getInteger('score', true);

    const trust = db.getAll('security_trust_scores') || {};
    trust[`${interaction.guild.id}-${user.id}`] = {
      score,
      by: interaction.user.id,
      at: Date.now(),
    };
    db.save('security_trust_scores', trust);

    return interaction.reply({ content: `Trust score pentru <@${user.id}> setat la ${score}.`, flags: MessageFlags.Ephemeral });
  },
};
