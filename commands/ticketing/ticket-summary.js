/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-summary')
    .setDescription('Rezumat intern pentru ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText || !channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in canale ticket-*.', flags: MessageFlags.Ephemeral });
    }

    const key = `${interaction.guild.id}-${channel.id}`;
    const claims = db.getAll('ticket_claims') || {};
    const tags = db.getAll('ticket_tags') || {};
    const notes = db.getAll('ticket_notes') || {};
    const escalations = db.getAll('ticket_escalations') || {};

    const claim = claims[channel.id] || claims[key];
    const noteCount = Array.isArray(notes[channel.id]) ? notes[channel.id].length : 0;
    const tagList = Array.isArray(tags[key]) ? tags[key] : [];
    const escalation = escalations[channel.id];

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`Ticket summary - ${channel.name}`)
      .addFields(
        { name: 'Owner/Claim', value: claim?.userId ? `<@${claim.userId}>` : 'Nesetat', inline: true },
        { name: 'Escalare', value: escalation?.level || 'Fara', inline: true },
        { name: 'Note', value: String(noteCount), inline: true },
        { name: 'Tag-uri', value: tagList.length ? tagList.join(', ') : 'Fara tag-uri' }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
