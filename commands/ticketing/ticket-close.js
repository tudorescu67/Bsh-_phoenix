/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('Inchide ticketul curent in 5 secunde')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 3,
  async execute(interaction) {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText || !interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in canale ticket-*.', flags: MessageFlags.Ephemeral });
    }

    await interaction.reply({ content: 'Ticketul se va inchide in 5 secunde...' });
    setTimeout(() => {
      interaction.channel.delete('Closed via ticket-close command').catch(() => {});
    }, 5000);
  },
};
