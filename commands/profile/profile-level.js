/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

function levelFromRep(rep) {
  const value = Math.max(0, Number(rep) || 0);
  const level = Math.floor(Math.sqrt(value / 5));
  const nextRep = Math.pow(level + 1, 2) * 5;
  return { rep: value, level, nextRep };
}

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-level')
    .setDescription('Afiseaza nivelul de profil pe baza reputatiei')
    .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(false)),
  cooldown: 3,
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const reps = db.getAll('profile_rep') || {};
    const key = `${interaction.guild.id}-${target.id}`;

    const info = levelFromRep(reps[key] || 0);
    const remaining = Math.max(0, info.nextRep - info.rep);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`Nivel Profil - ${target.tag}`)
      .addFields(
        { name: 'Nivel', value: String(info.level), inline: true },
        { name: 'Reputatie', value: String(info.rep), inline: true },
        { name: 'Pana la urmatorul nivel', value: `${remaining} rep`, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
