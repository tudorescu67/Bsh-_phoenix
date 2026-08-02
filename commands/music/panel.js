/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('music')
    .setDescription('Comenzi pentru sistemul de muzică')
    .addSubcommand(s => s
      .setName('panel')
      .setDescription('Trimite panoul de control radio & muzică')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'panel') {
      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('🎵 Radio & Music Player')
        .setDescription('Ascultă muzică de calitate sau posturile tale de radio preferate direct pe canalul de voce!\n\n> **Live Status:** Oprit ⏹️')
        .setThumbnail('https://i.imgur.com/3nK9jW7.png')
        .setFooter({ text: 'phoenixrisen.ro • Muzică' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('panel_music_play').setLabel('Play/Radio').setEmoji('▶️').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('panel_music_stop').setLabel('Stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('panel_music_status').setLabel('Ce ascultăm?').setEmoji('📻').setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ content: '✅ Panoul de muzică a fost trimis!', flags: MessageFlags.Ephemeral });
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }
  }
};
