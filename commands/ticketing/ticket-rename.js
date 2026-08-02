/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');

function sanitize(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);
}

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-rename')
    .setDescription('Redenumeste ticketul curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(option => option.setName('name').setDescription('Nume nou').setRequired(true).setMaxLength(28)),
  cooldown: 3,
  async execute(interaction) {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText || !interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in canale ticket-*.', flags: MessageFlags.Ephemeral });
    }

    const name = sanitize(interaction.options.getString('name', true));
    if (!name) {
      return interaction.reply({ content: 'Nume invalid pentru ticket.', flags: MessageFlags.Ephemeral });
    }

    await interaction.channel.setName(`ticket-${name}`, `ticket-rename by ${interaction.user.tag}`);
    return interaction.reply({ content: `Ticket redenumit in ${interaction.channel}.` });
  },
};
