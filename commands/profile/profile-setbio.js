/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-setbio')
    .setDescription('Seteaza bio-ul profilului tau')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Bio (max 200 caractere)')
        .setRequired(true)
        .setMaxLength(200)
    ),
  cooldown: 3,
  async execute(interaction) {
    const text = interaction.options.getString('text', true).trim();
    const key = `${interaction.guild.id}-${interaction.user.id}`;
    const profiles = db.getAll('profiles') || {};
    const prev = profiles[key] || {};
    profiles[key] = { ...prev, bio: text, updatedAt: Date.now() };
    db.save('profiles', profiles);

    return interaction.reply({ content: 'Bio actualizat cu succes.', flags: MessageFlags.Ephemeral });
  },
};
