/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-priority')
    .setDescription('Seteaza prioritatea ticketului curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option.setName('level')
        .setDescription('Nivel prioritate')
        .setRequired(true)
        .addChoices(
          { name: 'Low', value: 'low' },
          { name: 'Medium', value: 'medium' },
          { name: 'High', value: 'high' },
          { name: 'Critical', value: 'critical' }
        )
    ),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText || !channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in canale ticket-*.', flags: MessageFlags.Ephemeral });
    }

    const level = interaction.options.getString('level', true);
    const priorities = db.getAll('ticket_priorities') || {};
    priorities[channel.id] = {
      guildId: interaction.guild.id,
      level,
      setBy: interaction.user.id,
      updatedAt: Date.now(),
    };
    db.save('ticket_priorities', priorities);

    return interaction.reply({ content: `Prioritate setata pe **${level}** pentru acest ticket.` });
  },
};
