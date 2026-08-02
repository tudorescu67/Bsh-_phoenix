/* by Capitanul burcea,alex */
const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const { onMemberJoin, getInviteStats } = require('../utils/inviteTracker');

function fill(template, member, inviter, inviteCount) {
  return String(template || '')
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{tag}', member.user.tag)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{memberCount}', String(member.guild.memberCount))
    .replaceAll('{inviter}', inviter ? `<@${inviter.id}>` : 'o invitatie necunoscuta')
    .replaceAll('{inviterName}', inviter ? inviter.username : 'necunoscut')
    .replaceAll('{inviteCount}', String(inviteCount || 0));
}

function defaultMessage() {
  return 'Welcome {user}! Bine ai venit pe **{server}**. Ai fost invitat de {inviter}. {inviter} are acum **{inviteCount}** invitatii reale.';
}

function embedColor(config) {
  const value = String(config?.frameColor || '#D4AF37').replace('#', '');
  return /^[0-9a-f]{6}$/i.test(value) ? parseInt(value, 16) : 0xD4AF37;
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const inviteResult = await onMemberJoin(member).catch((err) => {
      console.error('[Invites Join Error]', err);
      return null;
    });
    const inviter = inviteResult?.inviter || null;
    const inviteStats = inviter ? getInviteStats(member.guild.id, inviter.id) : { real: 0 };

    const config = db.get('welcome_config', member.guild.id);
    if (!config) return;

    if (config.autoRoleId) {
      await member.roles.add(config.autoRoleId).catch(err => console.error('[Welcome AutoRole Error]', err));
    }

    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel) return;

    const text = fill(config.message || defaultMessage(), member, inviter, inviteStats.real);
    const embed = new EmbedBuilder()
      .setColor(embedColor(config))
      .setTitle(`Welcome ${member.user.username}`)
      .setDescription(`Bine ai venit pe **${member.guild.name}**.`)
      .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 256 }))
      .addFields(
        { name: 'Invitat de', value: inviter ? `<@${inviter.id}>` : 'Necunoscut', inline: true },
        { name: 'Invitatii reale', value: `${inviteStats.real || 0}`, inline: true },
        { name: 'Membru', value: `#${member.guild.memberCount}`, inline: true },
      )
      .setTimestamp();

    if (config.image) embed.setImage(config.image);

    await channel.send({
      content: text,
      embeds: [embed],
      allowedMentions: { users: [member.id, inviter?.id].filter(Boolean) },
    }).catch(err => console.error('[Welcome Message Error]', err));
  },
};
