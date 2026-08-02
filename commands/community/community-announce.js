/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-announce')
    .setDescription('Publica un anunt in canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option => option.setName('title').setDescription('Titlu').setRequired(true).setMaxLength(80))
    .addStringOption(option => option.setName('text').setDescription('Continut').setRequired(true).setMaxLength(1800)),
  cooldown: 4,
  async execute(interaction) {
    const title = interaction.options.getString('title', true);
    const text = interaction.options.getString('text', true);

    const embed = new EmbedBuilder()
      .setColor(0x00b0f4)
      .setTitle(title)
      .setDescription(text)
      .setFooter({ text: `Anunt de ${interaction.user.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
