/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-balance')
    .setDescription('Afiseaza balansul de coins')
    .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(false)),
  cooldown: 3,
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const wallets = db.getAll('profile_wallet') || {};
    const coins = Number(wallets[`${interaction.guild.id}-${target.id}`] || 0);

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`Balance - ${target.tag}`)
      .setDescription(`Coins: **${coins}**`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
