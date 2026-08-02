/* by Capitanul burcea,alex */
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    // Nickname schimbat
    if (oldMember.nickname !== newMember.nickname) {
      await sendLog(newMember.guild, 'nickname', {
        title: '✏️ Nickname Schimbat',
        user: newMember.user,
        before: oldMember.nickname || oldMember.user.username,
        after: newMember.nickname || newMember.user.username,
        thumbnail: newMember.user.displayAvatarURL({ dynamic: true }),
      });
    }

    // Roluri adaugate
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    for (const [, role] of addedRoles) {
      if (role.managed) continue;
      await sendLog(newMember.guild, 'role_add', {
        title: '➕ Rol Adaugat',
        user: newMember.user,
        extra: `Rol: ${role}`,
        thumbnail: newMember.user.displayAvatarURL({ dynamic: true }),
      });
    }

    // Roluri eliminate
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
    for (const [, role] of removedRoles) {
      if (role.managed) continue;
      await sendLog(newMember.guild, 'role_remove', {
        title: '➖ Rol Eliminat',
        user: newMember.user,
        extra: `Rol: ${role}`,
        thumbnail: newMember.user.displayAvatarURL({ dynamic: true }),
      });
    }

    // Boost
    if (!oldMember.premiumSince && newMember.premiumSince) {
      await sendLog(newMember.guild, 'boost', {
        title: '🚀 Server Boostat!',
        user: newMember.user,
        description: `**${newMember.user.tag}** a boostat serverul! 🎉`,
        thumbnail: newMember.user.displayAvatarURL({ dynamic: true }),
      });
    }
  },
};
