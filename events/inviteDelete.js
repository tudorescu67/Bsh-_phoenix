/* by Capitanul burcea,alex */
const { refreshInviteCache } = require('../utils/inviteTracker');

module.exports = {
  name: 'inviteDelete',
  async execute(invite) {
    if (invite.guild) await refreshInviteCache(invite.guild);
  },
};
