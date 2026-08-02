/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-roadmap')
    .setDescription('Publica un roadmap cu 3 puncte')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option => option.setName('title').setDescription('Titlu').setRequired(true).setMaxLength(80))
    .addStringOption(option => option.setName('item1').setDescription('Punct 1').setRequired(true).setMaxLength(150))
    .addStringOption(option => option.setName('item2').setDescription('Punct 2').setRequired(true).setMaxLength(150))
    .addStringOption(option => option.setName('item3').setDescription('Punct 3').setRequired(true).setMaxLength(150)),
  cooldown: 3,
  async execute(interaction) {
    const title = interaction.options.getString('title', true);
    const item1 = interaction.options.getString('item1', true);
    const item2 = interaction.options.getString('item2', true);
    const item3 = interaction.options.getString('item3', true);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`Roadmap: ${title}`)
      .setDescription(`1. ${item1}\n2. ${item2}\n3. ${item3}`)
      .setFooter({ text: `Publicat de ${interaction.user.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
