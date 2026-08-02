/* by Capitanul burcea,alex */
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'channelCreate',
  async execute(channel) {
    if (!channel.guild) return;
    await sendLog(channel.guild, 'channel_create', {
      title: '📁 Canal Creat',
      description: `Canal nou creat: **#${channel.name}**`,
      extra: `Tip: \`${channel.type}\`${channel.parent ? `\nCategorie: **${channel.parent.name}**` : ''}`,
      footer: `ID: ${channel.id}`,
    });
  },
};
