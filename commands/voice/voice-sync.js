/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('voice-sync')
    .setDescription('Sincronizeaza limit/bitrate dupa un canal sursa')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option => option.setName('source').setDescription('Canal voice sursa').setRequired(true)),
  cooldown: 3,
  async execute(interaction) {
    const current = interaction.member?.voice?.channel;
    const source = interaction.options.getChannel('source', true);

    if (!current || !current.isVoiceBased()) {
      return interaction.reply({ content: 'Trebuie sa fii intr-un canal voice.', flags: MessageFlags.Ephemeral });
    }
    if (!source.isVoiceBased()) {
      return interaction.reply({ content: 'Canalul sursa nu este voice.', flags: MessageFlags.Ephemeral });
    }

    await current.setBitrate(source.bitrate, `voice-sync by ${interaction.user.tag}`);
    await current.setUserLimit(source.userLimit, `voice-sync by ${interaction.user.tag}`);
    return interaction.reply({ content: `Canal sincronizat dupa ${source}.` });
  },
};
