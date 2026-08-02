/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('social')
    .setDescription('Comenzi pentru sistemul social & Tinder')
    .addSubcommand(s => s
      .setName('panel')
      .setDescription('Trimite panoul social & resurse')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'panel') {
      const embed = new EmbedBuilder()
        .setColor(0xEB459E)
        .setTitle('💖 Resurse & Social')
        .setDescription('Descoperă resurse utile sau găsește-ți jumătatea pe Phoenix Tinder!\n\n> **Secțiuni:**\n> 🔥 Phoenix Tinder\n> 📚 Bibliotecă Resurse\n> 🛠️ Tools Utile')
        .setThumbnail('https://i.imgur.com/2YyO6zZ.png')
        .setFooter({ text: 'phoenixrisen.ro • Social' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('panel_social_tinder').setLabel('Phoenix Tinder').setEmoji('🔥').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('panel_social_resources').setLabel('Resurse').setEmoji('📚').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('panel_social_tools').setLabel('Tools').setEmoji('🛠️').setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ content: '✅ Panoul social a fost trimis!', flags: MessageFlags.Ephemeral });
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }
  }
};
