/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

const WORK_MS = 60 * 60 * 1000;

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-work')
    .setDescription('Castiga coins o data pe ora'),
  cooldown: 3,
  async execute(interaction) {
    const now = Date.now();
    const claimDb = db.getAll('profile_work_claims') || {};
    const walletDb = db.getAll('profile_wallet') || {};
    const key = `${interaction.guild.id}-${interaction.user.id}`;

    if (claimDb[key] && now - claimDb[key] < WORK_MS) {
      const minutes = Math.ceil((WORK_MS - (now - claimDb[key])) / (60 * 1000));
      return interaction.reply({ content: `Mai asteapta ${minutes} minute pentru urmatorul work.`, flags: MessageFlags.Ephemeral });
    }

    const reward = 25 + Math.floor(Math.random() * 31);
    claimDb[key] = now;
    walletDb[key] = Number(walletDb[key] || 0) + reward;

    db.save('profile_work_claims', claimDb);
    db.save('profile_wallet', walletDb);

    return interaction.reply({ content: `Ai castigat ${reward} coins.` });
  },
};
