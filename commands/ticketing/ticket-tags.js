/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

function clean(tag) {
  return String(tag || '').trim().toLowerCase().replace(/\s+/g, '-').slice(0, 24);
}

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-tags')
    .setDescription('Administreaza tag-uri pentru ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Adauga tag')
        .addStringOption(option => option.setName('tag').setDescription('Tag').setRequired(true).setMaxLength(24))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Elimina tag')
        .addStringOption(option => option.setName('tag').setDescription('Tag').setRequired(true).setMaxLength(24))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Listeaza tag-uri')
    ),
  cooldown: 3,
  async execute(interaction) {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText || !interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in canale ticket-*.', flags: MessageFlags.Ephemeral });
    }

    const sub = interaction.options.getSubcommand();
    const key = `${interaction.guild.id}-${interaction.channel.id}`;
    const all = db.getAll('ticket_tags') || {};
    const tags = Array.isArray(all[key]) ? all[key] : [];

    if (sub === 'add') {
      const tag = clean(interaction.options.getString('tag', true));
      if (!tag) return interaction.reply({ content: 'Tag invalid.', flags: MessageFlags.Ephemeral });
      all[key] = [...new Set([...tags, tag])];
      db.save('ticket_tags', all);
      return interaction.reply({ content: `Tag adaugat: ${tag}` });
    }

    if (sub === 'remove') {
      const tag = clean(interaction.options.getString('tag', true));
      all[key] = tags.filter(value => value !== tag);
      db.save('ticket_tags', all);
      return interaction.reply({ content: `Tag eliminat: ${tag}`, flags: MessageFlags.Ephemeral });
    }

    if (!tags.length) {
      return interaction.reply({ content: 'Acest ticket nu are tag-uri.', flags: MessageFlags.Ephemeral });
    }

    return interaction.reply({ content: `Tag-uri: ${tags.join(', ')}`, flags: MessageFlags.Ephemeral });
  },
};
