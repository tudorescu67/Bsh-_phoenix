/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

// ── /slowmode ─────────────────────────────────────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Seteaza slowmode pe canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o => o.setName('secunde').setDescription('Secunde (0 = dezactivat, max 21600)').setMinValue(0).setMaxValue(21600).setRequired(true)),
  cooldown: 5,
  async execute(interaction) {
    const sec = interaction.options.getInteger('secunde');
    try {
      await interaction.channel.setRateLimitPerUser(sec);
      const msg = sec === 0 ? 'Slowmode dezactivat.' : `Slowmode setat la **${sec} secunde**.`;
      await interaction.reply({ embeds: [successEmbed(msg)] });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('Nu am putut seta slowmode.')], flags: MessageFlags.Ephemeral });
    }
  },
};
