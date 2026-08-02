/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Arunca zaruri (ex: 2d6, 1d20)')
    .addStringOption(o => o.setName('zar').setDescription('Format: NdX (ex: 2d6)').setRequired(false)),
  cooldown: 2,
  async execute(interaction) {
    const input = interaction.options.getString('zar') ?? '1d6';
    const match = input.match(/^(\d+)d(\d+)$/i);
    if (!match) return interaction.reply({ content: '❌ Format invalid. Foloseste: `2d6`, `1d20`, etc.', flags: MessageFlags.Ephemeral });

    const [, n, x] = match.map(Number);
    if (n > 20 || x > 1000) return interaction.reply({ content: '❌ Max 20 zaruri, max d1000.', flags: MessageFlags.Ephemeral });

    const results = Array.from({ length: n }, () => Math.floor(Math.random() * x) + 1);
    const total = results.reduce((a, b) => a + b, 0);

    const embed = new EmbedBuilder()
      .setColor(0xeb459e)
      .setTitle(`🎲 ${input.toUpperCase()}`)
      .addFields(
        { name: 'Rezultate', value: results.join(', '), inline: true },
        { name: 'Total', value: `**${total}**`, inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  },
};
