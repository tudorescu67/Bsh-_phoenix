/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ChannelType } = require('discord.js');
const db = require('../../utils/database');
const activityTracker = require('../../utils/activityTracker');
const inviteTracker = require('../../utils/inviteTracker');

function formatMinutes(minutes) {
  const value = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (hours <= 0) return `${mins} min`;
  return `${hours}h ${mins}m`;
}

function roleList(member) {
  const roles = member.roles.cache
    .filter((role) => role.id !== member.guild.id)
    .sort((a, b) => b.position - a.position)
    .map((role) => `${role}`)
    .slice(0, 12);
  return roles.length ? roles.join(', ') : 'Fara roluri';
}

async function profile(interaction) {
  const target = interaction.options.getUser('utilizator') || interaction.user;
  const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  const guildId = interaction.guild.id;
  const activity = activityTracker.getStats(guildId, target.id);
  const currentSession = activityTracker.getCurrentSessionMinutes(guildId, target.id);
  const invites = inviteTracker.getInviteStats(guildId, target.id);
  const account = typeof db.getUser === 'function' ? db.getUser(target.id, guildId) : null;

  const fields = [
    { name: 'Voice activity', value: `Total: **${formatMinutes(activity.totalMinutes)}**\nUltima sesiune: **${formatMinutes(activity.lastSession)}**\nAcum in VC: **${currentSession ? formatMinutes(currentSession) : 'nu'}**`, inline: true },
    { name: 'Invite-uri', value: `Total: **${invites.invites || 0}**\nPlecat: **${invites.left || 0}**\nFake: **${invites.fake || 0}**\nReal: **${invites.real || 0}**`, inline: true },
    { name: 'Discord', value: `Creat: <t:${Math.floor(target.createdTimestamp / 1000)}:R>\nIntrat: ${member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'necunoscut'}\nBot: **${target.bot ? 'da' : 'nu'}**`, inline: true },
  ];

  if (account) {
    fields.push({ name: 'BSH Progress', value: `Grade: **${account.grade || 0}**\nXP: **${account.xp || 0}**\nRang: **${account.rang || 'n/a'}**`, inline: true });
  }

  if (member) fields.push({ name: `Roluri (${Math.max(0, member.roles.cache.size - 1)})`, value: roleList(member), inline: false });

  const embed = new EmbedBuilder()
    .setColor(0x00d9ff)
    .setAuthor({ name: `${target.tag} - profil BSH`, iconURL: target.displayAvatarURL({ size: 128 }) })
    .setThumbnail(target.displayAvatarURL({ size: 256 }))
    .addFields(fields)
    .setFooter({ text: 'BSH stats: profil, activitate VC, invite-uri, roluri' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function server(interaction) {
  const guild = interaction.guild;
  const members = await guild.members.fetch().catch(() => guild.members.cache);
  const channels = guild.channels.cache;
  const roles = guild.roles.cache.filter((role) => role.id !== guild.id);
  const voiceChannels = channels.filter((channel) => channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice);
  const activeVoiceMembers = voiceChannels.reduce((sum, channel) => sum + channel.members.filter((member) => !member.user.bot).size, 0);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`Stats server - ${guild.name}`)
    .setThumbnail(guild.iconURL({ size: 256 }))
    .addFields(
      { name: 'Membri', value: `Total: **${guild.memberCount || members.size}**\nOameni cache: **${members.filter?.((m) => !m.user.bot).size || 'n/a'}**\nBoti cache: **${members.filter?.((m) => m.user.bot).size || 'n/a'}**`, inline: true },
      { name: 'Canale', value: `Text: **${channels.filter((c) => c.type === ChannelType.GuildText).size}**\nVoice: **${voiceChannels.size}**\nMembri in VC: **${activeVoiceMembers}**`, inline: true },
      { name: 'Roluri', value: `Total: **${roles.size}**\nTop: ${roles.sort((a, b) => b.position - a.position).first(8).map((r) => `${r}`).join(', ') || 'n/a'}`, inline: false },
    )
    .setTimestamp();

  return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function topVoice(interaction) {
  const limit = interaction.options.getInteger('limita') || 10;
  const top = activityTracker.getTop(interaction.guild.id, limit);
  const description = top.length
    ? top.map((entry, index) => `**${index + 1}.** <@${entry.userId}> - **${formatMinutes(entry.totalMinutes)}**`).join('\n')
    : 'Nu exista inca activitate VC salvata.';

  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(0xfee75c).setTitle('Top activitate VC').setDescription(description).setTimestamp()],
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Profil, activitate VC si statistici BSH')
    .addSubcommand((sub) => sub
      .setName('profil')
      .setDescription('Vezi profilul BSH al unui membru')
      .addUserOption((option) => option.setName('utilizator').setDescription('Membru optional')))
    .addSubcommand((sub) => sub
      .setName('server')
      .setDescription('Vezi statistici rapide despre server'))
    .addSubcommand((sub) => sub
      .setName('topvc')
      .setDescription('Top membri dupa activitatea in voice')
      .addIntegerOption((option) => option.setName('limita').setDescription('1-25 membri').setMinValue(1).setMaxValue(25))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'profil') return profile(interaction);
    if (subcommand === 'server') return server(interaction);
    if (subcommand === 'topvc') return topVoice(interaction);
    return interaction.reply({ content: 'Foloseste `/stats profil`, `/stats server` sau `/stats topvc`.', flags: MessageFlags.Ephemeral });
  },
};
