/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

const DAY_MS = 24 * 60 * 60 * 1000;

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-daily')
    .setDescription('Claim zilnic de reputatie profil'),
  cooldown: 3,
  async execute(interaction) {
    const key = `${interaction.guild.id}-${interaction.user.id}`;
    const claims = db.getAll('profile_daily') || {};
    const reps = db.getAll('profile_rep') || {};

    const now = Date.now();
    const row = claims[key] || { last: 0, streak: 0 };

    if (now - row.last < DAY_MS) {
      const remainHours = Math.ceil((DAY_MS - (now - row.last)) / (60 * 60 * 1000));
      return interaction.reply({ content: `Ai dat deja claim. Revino peste ~${remainHours}h.`, flags: MessageFlags.Ephemeral });
    }

    const streak = (now - row.last < 2 * DAY_MS) ? row.streak + 1 : 1;
    const reward = Math.min(5, 1 + Math.floor(streak / 3));

    claims[key] = { last: now, streak };
    reps[key] = (reps[key] || 0) + reward;

    db.save('profile_daily', claims);
    db.save('profile_rep', reps);

    return interaction.reply({ content: `Daily claim reusit: +${reward} rep. Streak: ${streak}.` });
  },
};
