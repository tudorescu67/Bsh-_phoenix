/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-event')
    .setDescription('Creeaza un event simplu pentru comunitate')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addStringOption(option => option.setName('title').setDescription('Titlu event').setRequired(true).setMaxLength(80))
    .addStringOption(option => option.setName('when').setDescription('Cand are loc').setRequired(true).setMaxLength(120))
    .addStringOption(option => option.setName('details').setDescription('Detalii').setRequired(false).setMaxLength(500)),
  cooldown: 3,
  async execute(interaction) {
    const title = interaction.options.getString('title', true);
    const when = interaction.options.getString('when', true);
    const details = interaction.options.getString('details') || 'Fara detalii suplimentare.';

    const events = db.getAll('community_events') || {};
    const id = `${Date.now()}`;
    events[id] = {
      guildId: interaction.guild.id,
      title,
      when,
      details,
      createdBy: interaction.user.id,
      status: 'open',
      createdAt: Date.now(),
    };
    db.save('community_events', events);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`Event #${id}`)
      .addFields(
        { name: 'Titlu', value: title },
        { name: 'Cand', value: when, inline: true },
        { name: 'Creat de', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Detalii', value: details }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    const msg = await interaction.fetchReply();
    await msg.react('✅').catch(() => {});
  },
};
