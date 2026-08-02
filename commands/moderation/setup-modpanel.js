/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-modpanel')
    .setDescription('Configurează un panou permanent de moderare')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🛡️ Centru de Moderare Phoenix')
      .setDescription('Folosește butoanele de mai jos pentru a accesa uneltele de moderare.\n\n' +
        '> **Notă:** Doar membrii Staff pot folosi aceste butoane.')
      .setThumbnail('https://i.imgur.com/8Nf9y2S.png')
      .setFooter({ text: 'phoenixrisen.ro • Admin Only' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('mod_general_panel')
        .setLabel('Deschide Panel Moderare')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('mod_view_logs')
        .setLabel('Vezi Logs Recente')
        .setEmoji('📜')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Panoul de moderare a fost trimis!', flags: MessageFlags.Ephemeral });
  }
};
