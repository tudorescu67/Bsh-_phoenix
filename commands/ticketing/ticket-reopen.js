/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-reopen')
    .setDescription('Redeschide ticketul curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      return interaction.reply({ content: 'Comanda merge doar in canale text.', flags: MessageFlags.Ephemeral });
    }

    const closed = channel.name.startsWith('closed-') || channel.name.startsWith('archive-');
    if (!closed) {
      return interaction.reply({ content: 'Canalul nu este marcat ca inchis.', flags: MessageFlags.Ephemeral });
    }

    const nextName = channel.name.replace(/^closed-/, 'ticket-').replace(/^archive-/, 'ticket-');
    await channel.setName(nextName, `ticket-reopen by ${interaction.user.tag}`);
    return interaction.reply({ content: `Ticket redeschis: ${channel}.` });
  },
};
