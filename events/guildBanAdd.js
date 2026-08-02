/* by Capitanul burcea,alex */
const { sendLog } = require('../utils/logger');
const { AuditLogEvent } = require('discord.js');
const { checkNuke } = require('../utils/antiNukeHandler');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban) {
    const { guild, user } = ban;

    // Log normal
    await sendLog(guild, 'staff', {
      title: '🚫 Membru Banat',
      description: `Utilizatorul **${user.tag}** a primit ban.`,
      footer: `ID: ${user.id}`,
    });

    // Anti-Nuke Check
    try {
      const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd,
      });
      const banLog = fetchedLogs.entries.first();
      if (banLog) {
        const { executor, target } = banLog;
        if (target.id === user.id) {
          await checkNuke(guild, executor.id, 'bans');
        }
      }
    } catch (err) {}
  },
};
