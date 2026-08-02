/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const mm = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder().setName('volume').setDescription('Seteaza volumul')
    .addIntegerOption(o => o.setName('procent').setDescription('Volum (1-150)').setMinValue(1).setMaxValue(150).setRequired(true)),
  cooldown: 2,
  async execute(interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: '❌ Trebuie sa fii in VC!', flags: MessageFlags.Ephemeral });
    const vol = interaction.options.getInteger('procent');
    const ok = mm.setVolume(interaction.guild.id, vol);
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setDescription(ok ? `🔊 Volum setat la **${vol}%**` : '❌ Nu se reda nimic.')] });
  },
};
