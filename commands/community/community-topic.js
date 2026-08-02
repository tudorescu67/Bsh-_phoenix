/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-topic')
    .setDescription('Seteaza topic pe canal text')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Canal text')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption(option => option.setName('topic').setDescription('Topic nou').setRequired(true).setMaxLength(1024)),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel', true);
    const topic = interaction.options.getString('topic', true);
    await channel.setTopic(topic, `community-topic by ${interaction.user.tag}`);
    return interaction.reply({ content: `Topic actualizat pentru ${channel}.`, flags: MessageFlags.Ephemeral });
  },
};
