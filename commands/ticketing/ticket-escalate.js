/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-escalate')
    .setDescription('Escaladeaza ticketul curent la un nivel mai mare')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option.setName('level')
        .setDescription('Nivelul de escaladare')
        .setRequired(true)
        .addChoices(
          { name: 'L1', value: 'L1' },
          { name: 'L2', value: 'L2' },
          { name: 'L3', value: 'L3' }
        )
    )
    .addStringOption(option => option.setName('reason').setDescription('Motiv').setRequired(false).setMaxLength(240)),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText || !channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in canale ticket-*.', flags: MessageFlags.Ephemeral });
    }

    const level = interaction.options.getString('level', true);
    const reason = interaction.options.getString('reason') || 'fara motiv';

    const escalations = db.getAll('ticket_escalations') || {};
    escalations[channel.id] = {
      guildId: interaction.guild.id,
      level,
      reason,
      by: interaction.user.id,
      at: Date.now(),
    };
    db.save('ticket_escalations', escalations);

    return interaction.reply({ content: `Ticket escaladat la ${level}. Motiv: ${reason}` });
  },
};
