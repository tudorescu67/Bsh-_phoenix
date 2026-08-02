/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const mm = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Arată ce melodie rulează acum'),

  async execute(interaction) {
    const q = mm.getQueueData(interaction.guild.id);
    if (!q || !q.current) return interaction.reply({ content: '⏹️ Momentan nu rulează nimic.', flags: MessageFlags.Ephemeral });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎵 Se redă acum')
      .setDescription(`**[${q.current.title}](${q.current.url})**`)
      .setThumbnail(q.current.thumbnail)
      .addFields(
        { name: '⏱️ Durata', value: q.current.duration, inline: true },
        { name: '👤 Cerut de', value: q.current.requester, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
