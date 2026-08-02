/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-note')
    .setDescription('Seteaza nota interna pe profil')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true))
    .addStringOption(option => option.setName('text').setDescription('Nota').setRequired(true).setMaxLength(240)),
  cooldown: 3,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const text = interaction.options.getString('text', true).trim();
    const key = `${interaction.guild.id}-${user.id}`;

    const notes = db.getAll('profile_notes') || {};
    notes[key] = {
      text,
      by: interaction.user.id,
      at: Date.now(),
    };
    db.save('profile_notes', notes);

    return interaction.reply({ content: `Nota salvata pentru <@${user.id}>.`, flags: MessageFlags.Ephemeral });
  },
};
