/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const mm = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Reia muzica'),
  cooldown: 2,
  async execute(interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: '❌ Trebuie sa fii in VC!', flags: MessageFlags.Ephemeral });
    const ok = mm.resume(interaction.guild.id);
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(ok ? '▶️ Muzica reia.' : '❌ Nimic nu e pe pauza.')] });
  },
};
