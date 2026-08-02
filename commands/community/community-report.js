/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-report')
    .setDescription('Trimite un report catre staff')
    .addUserOption(option => option.setName('user').setDescription('Utilizator raportat').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Motiv report').setRequired(true).setMaxLength(300)),
  cooldown: 4,
  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true).trim();

    const reports = db.getAll('community_reports') || {};
    const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    reports[id] = {
      guildId: interaction.guild.id,
      reporterId: interaction.user.id,
      targetId: target.id,
      reason,
      createdAt: Date.now(),
    };
    db.save('community_reports', reports);

    return interaction.reply({ content: `Report trimis cu ID ${id}.`, flags: MessageFlags.Ephemeral });
  },
};
