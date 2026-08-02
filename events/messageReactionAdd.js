/* by Capitanul burcea,alex */
const db = require('../utils/database');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;

    // Fetch partials daca e nevoie
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Something went wrong when fetching the reaction:', error);
        return;
      }
    }

    const guild = reaction.message.guild;
    if (!guild) return;

    // Verificam daca mesajul este cel de verificare
    const config = db.get('verify_config', guild.id);
    if (!config || config.tip !== 'reaction' || reaction.message.id !== config.messageId) return;

    // Verificam emoji-ul
    if (reaction.emoji.name !== '✅') return;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    // Daca are deja rolul, nu facem nimic
    if (member.roles.cache.has(config.roleId)) return;

    try {
      // Adaugam rolul de verificat
      await member.roles.add(config.roleId);

      // Scoatem rolul de neverificat daca exista
      if (config.removeRoleId) {
        await member.roles.remove(config.removeRoleId).catch(() => {});
      }

      // Incrementam contorul
      config.count = (config.count || 0) + 1;
      db.set('verify_config', guild.id, config);

      // Trimitem un mesaj privat (optional)
      await user.send(`✅ Ai fost verificat cu succes pe serverul **${guild.name}**!`).catch(() => {});
      
      // Scoatem reactia utilizatorului pentru a pastra panoul curat (optional)
      await reaction.users.remove(user.id).catch(() => {});

    } catch (err) {
      console.error('[Reaction Verify Error]', err);
    }
  },
};
