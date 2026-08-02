/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('security-incident')
    .setDescription('Logheaza un incident de securitate')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => option.setName('title').setDescription('Titlu incident').setRequired(true).setMaxLength(80))
    .addStringOption(option => option.setName('details').setDescription('Detalii').setRequired(true).setMaxLength(600)),
  cooldown: 4,
  async execute(interaction) {
    const title = interaction.options.getString('title', true);
    const details = interaction.options.getString('details', true);

    const incidents = db.getAll('security_incidents') || {};
    const id = `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    incidents[id] = {
      guildId: interaction.guild.id,
      title,
      details,
      by: interaction.user.id,
      at: Date.now(),
    };
    db.save('security_incidents', incidents);

    return interaction.reply({ content: `Incident salvat cu ID ${id}.`, flags: MessageFlags.Ephemeral });
  },
};
