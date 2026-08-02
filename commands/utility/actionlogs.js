/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function trimLine(value, max = 220) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('actionlogs')
    .setDescription('Vezi auditul rapid pentru actiunile importante ale botului')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption(option => option
      .setName('limita')
      .setDescription('Cate actiuni afiseaza')
      .setMinValue(1)
      .setMaxValue(25)
    )
    .addUserOption(option => option
      .setName('user')
      .setDescription('Filtreaza dupa user')
    )
    .addStringOption(option => option
      .setName('actiune')
      .setDescription('Filtreaza dupa actiune, ex: giveaway, command, antiraid')
    )
    .addStringOption(option => option
      .setName('status')
      .setDescription('Filtreaza dupa status')
      .addChoices(
        { name: 'success', value: 'success' },
        { name: 'blocked', value: 'blocked' },
        { name: 'failed', value: 'failed' },
        { name: 'info', value: 'info' },
      )
    ),

  cooldown: 5,

  async execute(interaction) {
    const limit = interaction.options.getInteger('limita') || 10;
    const user = interaction.options.getUser('user');
    const actionFilter = interaction.options.getString('actiune')?.toLowerCase();
    const statusFilter = interaction.options.getString('status');

    const byGuild = db.getAll('action_logs') || {};
    let logs = asArray(byGuild[interaction.guild.id]);

    if (user) logs = logs.filter(entry => entry.actorId === user.id);
    if (statusFilter) logs = logs.filter(entry => entry.status === statusFilter);
    if (actionFilter) {
      logs = logs.filter(entry => String(entry.action || '').toLowerCase().includes(actionFilter));
    }

    logs = logs.slice(0, limit);

    const embed = new EmbedBuilder()
      .setColor(0x00aeef)
      .setTitle('BSH Action Audit')
      .setDescription(logs.length ? 'Ultimele actiuni inregistrate pe server.' : 'Nu exista actiuni pentru filtrul ales.')
      .setFooter({ text: 'Audit minim: user, timp, actiune, target, status' })
      .setTimestamp();

    if (logs.length) {
      const lines = [];
      for (const entry of logs) {
        const ts = entry.createdAt ? `<t:${Math.floor(new Date(entry.createdAt).getTime() / 1000)}:R>` : 'fara timp';
        const actor = entry.actorId ? `<@${entry.actorId}>` : trimLine(entry.actorTag || 'system', 50);
        const target = entry.target ? ` -> ${trimLine(entry.target, 60)}` : '';
        const status = entry.status ? ` [${entry.status}]` : '';
        lines.push(`**${trimLine(entry.action, 70)}**${status}\n${ts} | ${actor}${target}`);
      }

      let description = lines.join('\n\n');
      if (description.length > 3900) description = `${description.slice(0, 3890)}...`;
      embed.setDescription(description);
    }

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
