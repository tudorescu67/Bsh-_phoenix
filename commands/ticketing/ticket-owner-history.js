/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-owner-history')
    .setDescription('Afiseaza istoricul ownerului pe ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText || !channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in ticket-*.', flags: MessageFlags.Ephemeral });
    }

    const history = db.getAll('ticket_owner_history') || {};
    const rows = Array.isArray(history[channel.id]) ? history[channel.id] : [];
    if (!rows.length) {
      return interaction.reply({ content: 'Nu exista istoric owner pentru acest ticket.', flags: MessageFlags.Ephemeral });
    }

    const text = rows.slice(-20).reverse().map((item, index) => `${index + 1}. <@${item.userId}> setat de <@${item.by}> | <t:${Math.floor(item.at / 1000)}:R>`).join('\n');
    return interaction.reply({ content: text, flags: MessageFlags.Ephemeral });
  },
};
