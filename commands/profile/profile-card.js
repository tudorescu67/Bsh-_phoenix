/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-card')
    .setDescription('Afiseaza un card de profil simplu')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Utilizatorul tinta')
        .setRequired(false)
    ),
  cooldown: 3,
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const key = `${interaction.guild.id}-${target.id}`;

    const profiles = db.getAll('profiles') || {};
    const reps = db.getAll('profile_rep') || {};
    const badges = db.getAll('profile_badges') || {};

    const profile = profiles[key] || {};
    const rep = reps[key] || 0;
    const list = badges[key] || [];

    const embed = new EmbedBuilder()
      .setColor(0x00b0f4)
      .setTitle(`Profil - ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Bio', value: profile.bio || 'Nesetat.' },
        { name: 'Reputatie', value: String(rep), inline: true },
        { name: 'Badge-uri', value: list.length ? list.slice(0, 8).join(', ') : 'Niciun badge', inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
