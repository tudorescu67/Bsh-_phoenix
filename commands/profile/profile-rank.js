/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-rank')
    .setDescription('Top reputatie profil')
    .addIntegerOption(option => option.setName('limit').setDescription('Cate pozitii').setRequired(false).setMinValue(3).setMaxValue(20)),
  cooldown: 4,
  async execute(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    const reps = db.getAll('profile_rep') || {};
    const prefix = `${interaction.guild.id}-`;

    const rows = Object.entries(reps)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => ({ userId: key.slice(prefix.length), rep: Number(value) || 0 }))
      .sort((a, b) => b.rep - a.rep)
      .slice(0, limit);

    if (!rows.length) {
      return interaction.reply({ content: 'Nu exista date de reputatie inca.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('Top Reputatie Profil')
      .setDescription(rows.map((row, index) => `${index + 1}. <@${row.userId}> - ${row.rep} rep`).join('\n'))
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
