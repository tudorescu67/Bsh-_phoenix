/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-watchlist')
    .setDescription('Administreaza watchlist interna de useri')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Adauga user in watchlist')
        .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Motiv').setRequired(false).setMaxLength(200))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Scoate user din watchlist')
        .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true))
    )
    .addSubcommand(sub => sub.setName('list').setDescription('Listeaza watchlist')),
  cooldown: 3,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const all = db.getAll('security_watchlist') || {};
    const key = interaction.guild.id;
    const list = Array.isArray(all[key]) ? all[key] : [];

    if (sub === 'add') {
      const user = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason') || 'fara motiv';
      const next = [...list.filter((item) => item.userId !== user.id), { userId: user.id, reason, at: Date.now() }];
      all[key] = next;
      db.save('security_watchlist', all);
      return interaction.reply({ content: `<@${user.id}> adaugat in watchlist.`, flags: MessageFlags.Ephemeral });
    }

    if (sub === 'remove') {
      const user = interaction.options.getUser('user', true);
      all[key] = list.filter((item) => item.userId !== user.id);
      db.save('security_watchlist', all);
      return interaction.reply({ content: `<@${user.id}> scos din watchlist.`, flags: MessageFlags.Ephemeral });
    }

    if (!list.length) {
      return interaction.reply({ content: 'Watchlist gol.', flags: MessageFlags.Ephemeral });
    }

    const text = list.slice(0, 20).map((item, index) => `${index + 1}. <@${item.userId}> - ${item.reason}`).join('\n');
    return interaction.reply({ content: text, flags: MessageFlags.Ephemeral });
  },
};
