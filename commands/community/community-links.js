/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-links')
    .setDescription('Gestioneaza linkuri importante ale comunitatii')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Seteaza un link')
        .addStringOption(option => option.setName('key').setDescription('Cheie').setRequired(true).setMaxLength(32))
        .addStringOption(option => option.setName('url').setDescription('URL').setRequired(true).setMaxLength(2000))
    )
    .addSubcommand(sub =>
      sub.setName('show')
        .setDescription('Afiseaza linkurile salvate')
    ),
  cooldown: 3,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const all = db.getAll('community_links') || {};

    if (sub === 'set') {
      const key = interaction.options.getString('key', true).trim().toLowerCase();
      const url = interaction.options.getString('url', true).trim();

      try {
        new URL(url);
      } catch {
        return interaction.reply({ content: 'URL invalid.', flags: MessageFlags.Ephemeral });
      }

      const guildLinks = all[interaction.guild.id] || {};
      guildLinks[key] = { url, updatedAt: Date.now(), updatedBy: interaction.user.id };
      all[interaction.guild.id] = guildLinks;
      db.save('community_links', all);

      return interaction.reply({ content: `Link salvat: ${key} -> ${url}`, flags: MessageFlags.Ephemeral });
    }

    const guildLinks = all[interaction.guild.id] || {};
    const entries = Object.entries(guildLinks);
    if (!entries.length) {
      return interaction.reply({ content: 'Nu exista linkuri salvate.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00b0f4)
      .setTitle('Linkuri comunitate')
      .setDescription(entries.map(([key, value]) => `**${key}**: ${value.url}`).join('\n'))
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
