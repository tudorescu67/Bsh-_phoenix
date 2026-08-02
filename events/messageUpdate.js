/* by Capitanul burcea,alex */
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    if (!oldMessage.content) return;

    await sendLog(newMessage.guild, 'message_edit', {
      title: '✏️ Mesaj Editat',
      user: newMessage.author,
      channel: newMessage.channel,
      description: `**Mesaj editat** in ${newMessage.channel} — [Salt la mesaj](${newMessage.url})`,
      before: oldMessage.content?.slice(0, 1020) || '*(indisponibil)*',
      after: newMessage.content?.slice(0, 1020) || '*(gol)*',
      footer: `ID Mesaj: ${newMessage.id}`,
      thumbnail: newMessage.author?.displayAvatarURL({ dynamic: true }),
    });
  },
};
