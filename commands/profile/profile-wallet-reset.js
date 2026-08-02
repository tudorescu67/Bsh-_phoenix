/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-wallet-reset')
    .setDescription('Reseteaza wallet-ul unui utilizator')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true)),
  cooldown: 3,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const wallets = db.getAll('profile_wallet') || {};
    wallets[`${interaction.guild.id}-${user.id}`] = 0;
    db.save('profile_wallet', wallets);

    return interaction.reply({ content: `Wallet resetat pentru <@${user.id}>.`, flags: MessageFlags.Ephemeral });
  },
};
