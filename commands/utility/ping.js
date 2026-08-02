/* by Capitanul burcea,alex */
// ── /ping ──────────────────────────────────────────────────────────────────────
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Afiseaza latenta botului'),

  cooldown: 3,

  async execute(interaction, client) {
    const sent = await interaction.reply({ content: '📡 Masurand...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const api = Math.round(client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(latency < 100 ? 0x57f287 : latency < 250 ? 0xfee75c : 0xed4245)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '⏱️ Latenta', value: `${latency}ms`, inline: true },
        { name: '💓 API Discord', value: `${api}ms`, inline: true }
      );

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
