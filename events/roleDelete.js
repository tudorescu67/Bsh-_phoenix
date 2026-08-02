/* by Capitanul burcea,alex */
const { sendLog } = require('../utils/logger');
const { AuditLogEvent } = require('discord.js');
const { checkNuke } = require('../utils/antiNukeHandler');

module.exports = {
  name: 'roleDelete',
  async execute(role) {
    // Log normal
    await sendLog(role.guild, 'role_delete', {
      title: '🏷️ Rol Șters',
      description: `Rol șters: **${role.name}**`,
      extra: `Culoare: \`${role.hexColor}\``,
      footer: `ID: ${role.id}`,
    });

    // Anti-Nuke Check
    try {
      const fetchedLogs = await role.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.RoleDelete,
      });
      const deletionLog = fetchedLogs.entries.first();
      if (deletionLog) {
        const { executor, target } = deletionLog;
        if (target.id === role.id) {
          await checkNuke(role.guild, executor.id, 'roles');
        }
      }
    } catch (err) {}
  },
};
