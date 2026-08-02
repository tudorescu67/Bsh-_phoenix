/* by Capitanul burcea,alex */
const { sendLog } = require('../utils/logger');
const { AuditLogEvent } = require('discord.js');
const { checkNuke } = require('../utils/antiNukeHandler');

module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    if (!channel.guild) return;

    // Log-ul normal
    await sendLog(channel.guild, 'channel_delete', {
      title: '📁 Canal Șters',
      description: `Canal șters: **#${channel.name}**`,
      extra: `Tip: \`${channel.type}\`${channel.parent ? `\nCategorie: **${channel.parent.name}**` : ''}`,
      footer: `ID: ${channel.id}`,
    });

    // Anti-Nuke Check
    try {
      const fetchedLogs = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.ChannelDelete,
      });
      const deletionLog = fetchedLogs.entries.first();
      if (deletionLog) {
        const { executor, target } = deletionLog;
        if (target.id === channel.id) {
          await checkNuke(channel.guild, executor.id, 'channels');
        }
      }
    } catch (err) {}
  },
};
