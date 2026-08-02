/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-transfer')
    .setDescription('Transfera reputatie catre alt utilizator')
    .addUserOption(option => option.setName('user').setDescription('Destinatar').setRequired(true))
    .addIntegerOption(option => option.setName('amount').setDescription('Cantitate rep').setRequired(true).setMinValue(1).setMaxValue(100)),
  cooldown: 6,
  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'Nu poti transfera catre tine.', flags: MessageFlags.Ephemeral });
    }

    const reps = db.getAll('profile_rep') || {};
    const fromKey = `${interaction.guild.id}-${interaction.user.id}`;
    const toKey = `${interaction.guild.id}-${target.id}`;

    const current = Number(reps[fromKey] || 0);
    if (current < amount) {
      return interaction.reply({ content: `Ai nevoie de ${amount} rep, dar ai doar ${current}.`, flags: MessageFlags.Ephemeral });
    }

    reps[fromKey] = current - amount;
    reps[toKey] = Number(reps[toKey] || 0) + amount;
    db.save('profile_rep', reps);

    return interaction.reply({ content: `Ai transferat ${amount} rep lui <@${target.id}>.` });
  },
};
