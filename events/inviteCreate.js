/* by Capitanul burcea,alex */
const { refreshInviteCache } = require('../utils/inviteTracker');

module.exports = {
  name: 'inviteCreate',
  async execute(invite) {
    if (invite.guild) await refreshInviteCache(invite.guild);
  },
};
