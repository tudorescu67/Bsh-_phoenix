/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

function unique(values) {
  return [...new Set(values)];
}

module.exports = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('profile-badges')
    .setDescription('Administreaza badge-urile de profil')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub.setName('grant')
        .setDescription('Acorda un badge')
        .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true))
        .addStringOption(option => option.setName('badge').setDescription('Nume badge').setRequired(true).setMaxLength(32))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Scoate un badge')
        .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true))
        .addStringOption(option => option.setName('badge').setDescription('Nume badge').setRequired(true).setMaxLength(32))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Listeaza badge-uri')
        .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true))
    ),
  cooldown: 3,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user', true);
    const key = `${interaction.guild.id}-${user.id}`;

    const badges = db.getAll('profile_badges') || {};
    const current = Array.isArray(badges[key]) ? badges[key] : [];

    if (sub === 'grant') {
      const badge = interaction.options.getString('badge', true).trim();
      badges[key] = unique([...current, badge]);
      db.save('profile_badges', badges);
      return interaction.reply({ content: `Badge acordat: ${badge} -> <@${user.id}>` });
    }

    if (sub === 'remove') {
      const badge = interaction.options.getString('badge', true).trim();
      badges[key] = current.filter(x => x !== badge);
      db.save('profile_badges', badges);
      return interaction.reply({ content: `Badge eliminat: ${badge} -> <@${user.id}>`, flags: MessageFlags.Ephemeral });
    }

    if (!current.length) {
      return interaction.reply({ content: 'Utilizatorul nu are badge-uri.', flags: MessageFlags.Ephemeral });
    }

    return interaction.reply({ content: `Badge-uri pentru <@${user.id}>: ${current.join(', ')}`, flags: MessageFlags.Ephemeral });
  },
};
