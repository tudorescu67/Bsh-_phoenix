/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-transfer-coins')
    .setDescription('Transfera coins catre alt utilizator')
    .addUserOption(option => option.setName('user').setDescription('Destinatar').setRequired(true))
    .addIntegerOption(option => option.setName('amount').setDescription('Suma').setRequired(true).setMinValue(1).setMaxValue(100000)),
  cooldown: 3,
  async execute(interaction) {
    const to = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);

    if (to.id === interaction.user.id) {
      return interaction.reply({ content: 'Nu poti transfera catre tine.', flags: MessageFlags.Ephemeral });
    }

    const wallets = db.getAll('profile_wallet') || {};
    const fromKey = `${interaction.guild.id}-${interaction.user.id}`;
    const toKey = `${interaction.guild.id}-${to.id}`;

    const fromCoins = Number(wallets[fromKey] || 0);
    if (fromCoins < amount) {
      return interaction.reply({ content: `Fonduri insuficiente. Ai ${fromCoins} coins.`, flags: MessageFlags.Ephemeral });
    }

    wallets[fromKey] = fromCoins - amount;
    wallets[toKey] = Number(wallets[toKey] || 0) + amount;
    db.save('profile_wallet', wallets);

    return interaction.reply({ content: `Transfer efectuat: ${amount} coins catre <@${to.id}>.` });
  },
};
