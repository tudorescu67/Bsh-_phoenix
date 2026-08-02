/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('voice-bitrate')
    .setDescription('Seteaza bitrate-ul pe canalul voice curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(option => option.setName('kbps').setDescription('Bitrate in kbps').setRequired(true).setMinValue(8).setMaxValue(384)),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.member?.voice?.channel;
    if (!channel) {
      return interaction.reply({ content: 'Trebuie sa fii intr-un canal voice.', flags: MessageFlags.Ephemeral });
    }

    const kbps = interaction.options.getInteger('kbps', true);
    await channel.setBitrate(kbps * 1000, `voice-bitrate by ${interaction.user.tag}`);
    return interaction.reply({ content: `Bitrate setat la ${kbps} kbps pentru ${channel}.` });
  },
};
