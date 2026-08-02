/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-briefing')
    .setDescription('Publica un briefing rapid pentru comunitate')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option => option.setName('title').setDescription('Titlu').setRequired(true).setMaxLength(80))
    .addStringOption(option => option.setName('summary').setDescription('Rezumat').setRequired(true).setMaxLength(600)),
  cooldown: 3,
  async execute(interaction) {
    const title = interaction.options.getString('title', true);
    const summary = interaction.options.getString('summary', true);

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`Briefing: ${title}`)
      .setDescription(summary)
      .setFooter({ text: `Publicat de ${interaction.user.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
