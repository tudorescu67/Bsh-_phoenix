/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Comenzi pentru sistemul de giveaway')
    .addSubcommand(s => s
      .setName('panel')
      .setDescription('Trimite panoul de control giveaway')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'panel') {
      const embed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle('🎁 Panou Giveaway')
        .setDescription('Apasă pe butonul de mai jos pentru a vedea giveaway-urile active sau pentru a crea unul nou (doar Staff)!')
        .setThumbnail('https://i.imgur.com/8Nf9y2S.png')
        .setFooter({ text: 'phoenixrisen.ro • Giveaways' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('panel_giveaway_view').setLabel('Vezi Active').setEmoji('🎉').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('panel_giveaway_create').setLabel('Creează (Staff)').setEmoji('➕').setStyle(ButtonStyle.Success)
      );

      await interaction.reply({ content: '✅ Panoul de giveaway a fost trimis!', flags: MessageFlags.Ephemeral });
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }
  }
};
