/* by Capitanul burcea,alex */
const { cacheInvites } = require('../commands/utility/invites');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    console.log(`✅ Adaugat pe: ${guild.name} (${guild.id}) — ${guild.memberCount} membri`);
    await cacheInvites(guild).catch(() => {});
  },
};
