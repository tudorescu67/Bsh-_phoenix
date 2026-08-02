/* by Capitanul burcea,alex */
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'roleCreate',
  async execute(role) {
    await sendLog(role.guild, 'role_create', {
      title: '🏷️ Rol Creat',
      description: `Rol nou creat: **${role.name}**`,
      extra: `Culoare: \`${role.hexColor}\`\nMentionabil: ${role.mentionable ? 'Da' : 'Nu'}\nAfisat separat: ${role.hoist ? 'Da' : 'Nu'}`,
      footer: `ID: ${role.id}`,
    });
  },
};
