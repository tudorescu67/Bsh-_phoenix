/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('voice-limit')
    .setDescription('Seteaza limita pe canalul voice curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(option => option.setName('limit').setDescription('0 pentru nelimitat').setRequired(true).setMinValue(0).setMaxValue(99)),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.member?.voice?.channel;
    if (!channel) {
      return interaction.reply({ content: 'Trebuie sa fii intr-un canal voice.', flags: MessageFlags.Ephemeral });
    }

    const limit = interaction.options.getInteger('limit', true);
    await channel.setUserLimit(limit, `voice-limit by ${interaction.user.tag}`);
    return interaction.reply({ content: `Limita pentru ${channel} este acum ${limit === 0 ? 'nelimitata' : limit}.` });
  },
};
