/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-adduser')
    .setDescription('Adauga un utilizator in ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true)),
  cooldown: 3,
  async execute(interaction) {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText || !interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in canale ticket-*.', flags: MessageFlags.Ephemeral });
    }

    const user = interaction.options.getUser('user', true);
    await interaction.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    }, { reason: `ticket-adduser by ${interaction.user.tag}` });

    return interaction.reply({ content: `<@${user.id}> a fost adaugat in ticket.` });
  },
};
