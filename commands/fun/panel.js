/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('games')
    .setDescription('Comenzi pentru sistemul de jocuri')
    .addSubcommand(s => s
      .setName('panel')
      .setDescription('Trimite panoul de jocuri & casino')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'panel') {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎮 Centru de Jocuri & Casino')
        .setDescription('Încearcă-ți norocul sau joacă-te cu prietenii!\n\n> **Jocuri disponibile:**\n> 🎰 Slots\n> 🪙 Coinflip\n> 🃏 Blackjack (În curând)')
        .setThumbnail('https://i.imgur.com/w8qP7fH.png')
        .setFooter({ text: 'phoenixrisen.ro • Fun Zone' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('panel_games_slots').setLabel('Slots').setEmoji('🎰').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('panel_games_flip').setLabel('Coinflip').setEmoji('🪙').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('panel_games_rank').setLabel('Rank-ul Meu').setEmoji('📊').setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ content: '✅ Panoul de jocuri a fost trimis!', flags: MessageFlags.Ephemeral });
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }
  }
};
