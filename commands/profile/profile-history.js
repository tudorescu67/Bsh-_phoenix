/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-history')
    .setDescription('Istoric rep pentru un utilizator')
    .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(false))
    .addIntegerOption(option => option.setName('limit').setDescription('Cate intrari').setRequired(false).setMinValue(3).setMaxValue(20)),
  cooldown: 3,
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const limit = interaction.options.getInteger('limit') || 8;

    const logs = Object.values(db.getAll('profile_rep_logs') || {})
      .filter(item => item.guildId === interaction.guild.id && item.toUserId === user.id)
      .sort((a, b) => b.at - a.at)
      .slice(0, limit);

    if (!logs.length) {
      return interaction.reply({ content: 'Nu exista istoric pentru acest utilizator.', flags: MessageFlags.Ephemeral });
    }

    const text = logs
      .map((item, index) => `${index + 1}. +1 de la <@${item.fromUserId}> | ${item.reason || 'fara motiv'} | <t:${Math.floor(item.at / 1000)}:R>`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`Rep history - ${user.tag}`)
      .setDescription(text.slice(0, 3900))
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
