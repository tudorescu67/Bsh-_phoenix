/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-owner')
    .setDescription('Seteaza owner-ul ticketului')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(option => option.setName('user').setDescription('Noul owner').setRequired(true)),
  cooldown: 3,
  async execute(interaction) {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText || !interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in canale ticket-*.', flags: MessageFlags.Ephemeral });
    }

    const user = interaction.options.getUser('user', true);
    const claims = db.getAll('ticket_claims') || {};
    claims[interaction.channel.id] = {
      guildId: interaction.guild.id,
      userId: user.id,
      at: Date.now(),
      changedBy: interaction.user.id,
    };
    db.save('ticket_claims', claims);

    return interaction.reply({ content: `Owner ticket setat pe <@${user.id}>.` });
  },
};
