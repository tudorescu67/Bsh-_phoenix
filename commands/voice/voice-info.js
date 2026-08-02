/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('voice-info')
    .setDescription('Arata informatii despre canalul voice curent'),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.member?.voice?.channel;
    if (!channel) {
      return interaction.reply({ content: 'Trebuie sa fii intr-un canal voice.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`Voice info - ${channel.name}`)
      .addFields(
        { name: 'Canal ID', value: channel.id, inline: true },
        { name: 'Membri', value: String(channel.members.size), inline: true },
        { name: 'Limita', value: channel.userLimit === 0 ? 'Nelimitat' : String(channel.userLimit), inline: true },
        { name: 'Bitrate', value: `${Math.round(channel.bitrate / 1000)} kbps`, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
