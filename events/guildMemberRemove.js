/* by Capitanul burcea,alex */
const { EmbedBuilder } = require('discord.js');
const { onMemberLeave } = require('../utils/inviteTracker');
const { sendLog } = require('../utils/logger');
const db = require('../utils/database');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    await onMemberLeave(member).catch(() => {});

    // Sterge aplicatia daca exista
    const allApps = db.getAll('applications') || {};
    const userAppKey = Object.keys(allApps).find(k => k.startsWith(`${member.guild.id}_${member.id}`));
    if (userAppKey) {
      db.del('applications', userAppKey);
    }

    // Mesaj de leave
    const welcomeCfg = db.get('welcome', member.guild.id);
    if (welcomeCfg?.showLeave) {
      const channel = welcomeCfg?.channelId
        ? member.guild.channels.cache.get(welcomeCfg.channelId)
        : member.guild.systemChannel;
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle('📤 Plecat')
          .setDescription(`**${member.user.tag}** a parasit serverul.`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields({ name: '👥 Membri totali', value: `${member.guild.memberCount}`, inline: true })
          .setTimestamp();
        channel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    // Log
    const roles = member.roles.cache
      .filter(r => r.id !== member.guild.id)
      .map(r => r.name).join(', ') || 'Niciun rol';

    await sendLog(member.guild, 'member_leave', {
      title: '📤 Membru Plecat',
      user: member.user,
      description: `**${member.user.tag}** a parasit serverul`,
      extra: `Roluri avute: ${roles.slice(0, 500)}`,
      thumbnail: member.user.displayAvatarURL({ dynamic: true }),
      footer: `ID: ${member.id}`,
    });
  },
};
