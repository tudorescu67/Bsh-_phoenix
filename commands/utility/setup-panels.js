/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-panels')
    .setDescription('Configurează panourile interactive Phoenix Risen')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o => o.setName('canal').setDescription('Canalul unde vor fi trimise panourile').setRequired(true).addChannelTypes(ChannelType.GuildText)),

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // 1. Panou Giveaway
    const giveawayEmbed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('🎁 Panou Giveaway')
      .setDescription('Apasă pe butonul de mai jos pentru a vedea giveaway-urile active sau pentru a crea unul nou (doar Staff)!')
      .setThumbnail('https://i.imgur.com/8Nf9y2S.png')
      .setFooter({ text: 'phoenixrisen.ro • Giveaways' });

    const giveawayRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('panel_giveaway_view').setLabel('Vezi Active').setEmoji('🎉').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('panel_giveaway_create').setLabel('Creează (Staff)').setEmoji('➕').setStyle(ButtonStyle.Success)
    );

    // 2. Panou Jocuri & Fun
    const gamesEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎮 Centru de Jocuri & Casino')
      .setDescription('Încearcă-ți norocul sau joacă-te cu prietenii!\n\n> **Jocuri disponibile:**\n> 🎰 Slots\n> 🪙 Coinflip\n> 🃏 Blackjack\n> 📊 Rank & XP')
      .setThumbnail('https://i.imgur.com/w8qP7fH.png')
      .setFooter({ text: 'phoenixrisen.ro • Fun Zone' });

    const gamesRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('panel_games_slots').setLabel('Slots').setEmoji('🎰').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_games_flip').setLabel('Coinflip').setEmoji('🪙').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_games_blackjack').setLabel('Blackjack').setEmoji('🃏').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_games_rank').setLabel('Rank-ul Meu').setEmoji('📊').setStyle(ButtonStyle.Primary)
    );

    // 3. Panou Resurse & Tinder
    const resourcesEmbed = new EmbedBuilder()
      .setColor(0xEB459E)
      .setTitle('💖 Resurse & Social')
      .setDescription('Descoperă resurse utile sau găsește-ți jumătatea pe Phoenix Tinder!\n\n> **Secțiuni:**\n> 🔥 Phoenix Tinder\n> 📚 Bibliotecă Resurse\n> 🛠️ Tools Utile')
      .setThumbnail('https://i.imgur.com/2YyO6zZ.png')
      .setFooter({ text: 'phoenixrisen.ro • Social' });

    const resourcesRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('panel_social_tinder').setLabel('Phoenix Tinder').setEmoji('🔥').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('panel_social_resources').setLabel('Resurse').setEmoji('📚').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('panel_social_tools').setLabel('Tools').setEmoji('🛠️').setStyle(ButtonStyle.Secondary)
    );

    // 4. Panou Radio & Muzică
    const radioEmbed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🎵 Radio & Music Player')
      .setDescription('Ascultă muzică de calitate sau posturile tale de radio preferate direct pe canalul de voce!\n\n> **Live Status:** Oprit ⏹️')
      .setThumbnail('https://i.imgur.com/3nK9jW7.png')
      .setFooter({ text: 'phoenixrisen.ro • Muzică' });

    const radioRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('panel_music_play').setLabel('Play / Radio / Library').setEmoji('▶️').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('panel_music_stop').setLabel('Stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('panel_music_status').setLabel('Ce ascultăm?').setEmoji('📻').setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [giveawayEmbed], components: [giveawayRow] });
    await channel.send({ embeds: [gamesEmbed], components: [gamesRow] });
    await channel.send({ embeds: [resourcesEmbed], components: [resourcesRow] });
    await channel.send({ embeds: [radioEmbed], components: [radioRow] });

    // 5. Panou Tools Utile
    const toolsEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🛠️ Centru de Unelte Phoenix')
      .setDescription('Accesează rapid uneltele de utilitate ale serverului!\n\n' +
        '> 🌡️ **Vremea** - Verifică prognoza meteo\n' +
        '> 🔤 **Traducere** - Traducere rapidă RO-EN\n' +
        '> 🤖 **AI Chat** - Vorbește cu inteligența artificială\n' +
        '> 🐛 **Bug Report** - Raportează probleme')
      .setThumbnail('https://i.imgur.com/8Nf9y2S.png')
      .setFooter({ text: 'phoenixrisen.ro • Utility' });

    const toolsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('panel_tools_weather').setLabel('Vremea').setEmoji('🌡️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_tools_translate').setLabel('Traducere').setEmoji('🔤').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_tools_ai').setLabel('AI Chat').setEmoji('🤖').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('panel_tools_bug').setLabel('Bug Report').setEmoji('🐛').setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [toolsEmbed], components: [toolsRow] });

    await interaction.editReply({ content: `✅ Toate panourile interactive au fost trimise în ${channel}!` });
  }
};
