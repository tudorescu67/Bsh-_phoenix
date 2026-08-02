/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-note')
    .setDescription('Adauga o nota interna pe ticketul curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option => option.setName('text').setDescription('Nota').setRequired(true).setMaxLength(500)),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText || !channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in canale ticket-*.', flags: MessageFlags.Ephemeral });
    }

    const text = interaction.options.getString('text', true).trim();
    const notes = db.getAll('ticket_notes') || {};
    if (!notes[channel.id]) notes[channel.id] = [];
    notes[channel.id].push({ by: interaction.user.id, text, at: Date.now() });
    db.save('ticket_notes', notes);

    return interaction.reply({ content: 'Nota a fost salvata pentru acest ticket.', flags: MessageFlags.Ephemeral });
  },
};
