/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const mm = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pauza muzica'),
  cooldown: 2,
  async execute(interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: '❌ Trebuie sa fii in VC!', flags: MessageFlags.Ephemeral });
    const ok = mm.pause(interaction.guild.id);
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xfee75c).setDescription(ok ? '⏸️ Muzica pusa pe pauza.' : '❌ Nimic nu se reda.')] });
  },
};
