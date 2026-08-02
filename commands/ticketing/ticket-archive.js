/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-archive')
    .setDescription('Arhiveaza ticketul curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText || !channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in ticket-*.', flags: MessageFlags.Ephemeral });
    }

    await channel.setName(`archive-${channel.name}`, `ticket-archive by ${interaction.user.tag}`);
    return interaction.reply({ content: `Ticket arhivat: ${channel}.` });
  },
};
