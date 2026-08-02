/* by Capitanul burcea,alex */
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild) return;
    if (message.author?.bot) return;
    if (!message.content && message.attachments.size === 0) return;

    const content = message.content || '*(mesaj fara text)*';
    const attachments = message.attachments.size > 0
      ? `\n📎 ${message.attachments.size} fisier(e) atasat(e)` : '';

    await sendLog(message.guild, 'message_delete', {
      title: '🗑️ Mesaj Sters',
      user: message.author,
      channel: message.channel,
      description: `**Mesaj sters** in ${message.channel}`,
      before: content.slice(0, 1020) + attachments,
      footer: `ID Mesaj: ${message.id}`,
      thumbnail: message.author?.displayAvatarURL({ dynamic: true }),
    });
  },
};
