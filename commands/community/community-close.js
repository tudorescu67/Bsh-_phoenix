/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-close')
    .setDescription('Inchide un event comunitar deschis')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addStringOption(option => option.setName('id').setDescription('ID event').setRequired(true)),
  cooldown: 3,
  async execute(interaction) {
    const id = interaction.options.getString('id', true);
    const events = db.getAll('community_events') || {};
    const event = events[id];

    if (!event || event.guildId !== interaction.guild.id) {
      return interaction.reply({ content: 'Event inexistent pentru acest server.', flags: MessageFlags.Ephemeral });
    }

    if (event.status === 'closed') {
      return interaction.reply({ content: 'Eventul este deja inchis.', flags: MessageFlags.Ephemeral });
    }

    event.status = 'closed';
    event.closedBy = interaction.user.id;
    event.closedAt = Date.now();
    db.save('community_events', events);

    return interaction.reply({ content: `Event #${id} a fost inchis.` });
  },
};
