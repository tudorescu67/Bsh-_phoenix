/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-claim')
    .setDescription('Preia ticketul curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 3,
  async execute(interaction) {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText || !interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in canale ticket-*.', flags: MessageFlags.Ephemeral });
    }

    const claims = db.getAll('ticket_claims') || {};
    claims[interaction.channel.id] = {
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      at: Date.now(),
    };
    db.save('ticket_claims', claims);

    return interaction.reply({ content: `Ticket preluat de <@${interaction.user.id}>.` });
  },
};
