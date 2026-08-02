/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-rep')
    .setDescription('Ofera reputatie unui utilizator')
    .addUserOption(option => option.setName('user').setDescription('Utilizator tinta').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Motiv optional').setRequired(false).setMaxLength(150)),
  cooldown: 3,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'fara motiv';

    if (user.id === interaction.user.id) {
      return interaction.reply({ content: 'Nu poti da rep propriei persoane.', flags: MessageFlags.Ephemeral });
    }

    const key = `${interaction.guild.id}-${user.id}`;
    const reps = db.getAll('profile_rep') || {};
    reps[key] = (Number(reps[key]) || 0) + 1;
    db.save('profile_rep', reps);

    const logs = db.getAll('profile_rep_logs') || {};
    logs[`${Date.now()}-${Math.floor(Math.random() * 1000)}`] = {
      guildId: interaction.guild.id,
      fromUserId: interaction.user.id,
      toUserId: user.id,
      reason,
      at: Date.now(),
    };
    db.save('profile_rep_logs', logs);

    return interaction.reply({ content: `+1 rep pentru <@${user.id}>. Motiv: ${reason}` });
  },
};
