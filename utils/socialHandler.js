/* by Capitanul burcea,alex */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const db = require('./database');

async function handleSocialPanel(interaction) {
  const id = interaction.customId;

  if (id === 'panel_social_tinder') {
    const userId = interaction.user.id;
    const profile = db.get('tinder_profiles', userId);

    if (!profile) {
      // Create profile modal
      const modal = new ModalBuilder().setCustomId('panel_tinder_modal_create').setTitle('🔥 Creează Profil Phoenix Tinder');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('age').setLabel('Vârsta').setPlaceholder('ex: 18').setRequired(true).setStyle(TextInputStyle.Short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bio').setLabel('Descriere (Bio)').setPlaceholder('Ceva despre tine...').setRequired(true).setStyle(TextInputStyle.Paragraph)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('gender').setLabel('Gen (M/F)').setPlaceholder('M sau F').setRequired(true).setStyle(TextInputStyle.Short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('interests').setLabel('Interese').setPlaceholder('ex: Gaming, Muzică, Sport').setRequired(false).setStyle(TextInputStyle.Short))
      );
      return interaction.showModal(modal);
    }

    // Swipe interface
    const allProfiles = db.getAll('tinder_profiles') || {};
    const others = Object.entries(allProfiles).filter(([uid]) => uid !== userId);
    
    if (others.length === 0) return interaction.reply({ content: '❌ Nu există alte profiluri momentan. Fii primul care sparge gheața!', flags: MessageFlags.Ephemeral });

    const randomEntry = others[Math.floor(Math.random() * others.length)];
    const [targetId, targetData] = randomEntry;
    const targetUser = await interaction.client.users.fetch(targetId).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(0xEB459E)
      .setTitle(`🔥 Phoenix Tinder — ${targetUser?.username || 'Utilizator'}`)
      .setDescription(`**Vârstă:** ${targetData.age}\n**Gen:** ${targetData.gender}\n**Bio:** ${targetData.bio}\n**Interese:** ${targetData.interests || 'N/A'}`)
      .setThumbnail(targetUser?.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Apasă ❤️ pentru LIKE sau ❌ pentru SKIP' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`tinder_like_${targetId}`).setLabel('Like').setEmoji('❤️').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`tinder_skip_${targetId}`).setLabel('Skip').setEmoji('❌').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_social_tinder').setLabel('Refresh').setEmoji('🔄').setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  }

  if (id === 'panel_social_resources') {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📚 Bibliotecă Resurse Phoenix Risen')
      .setDescription('Aici găsești resurse utile pentru server și comunitate!\n\n> **[Grafică GFX](https://phoenixrisen.ro/gfx)**\n> **[Configurații Bot](https://phoenixrisen.ro/docs)**\n> **[Parteneriate](https://phoenixrisen.ro/partners)**\n\n> Mai multe resurse vor fi adăugate curând!')
      .setFooter({ text: 'phoenixrisen.ro' });

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  if (id === 'panel_social_tools') {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🛠️ Tools Phoenix Risen')
      .setDescription('Comenzi de utilitate rapidă:\n\n> 🌡️ /tools weather\n> 🔤 /tools translate\n> 📊 /rank\n> 📨 /invites')
      .setFooter({ text: 'Folosește comenzile slash direct în chat!' });

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}

module.exports = { handleSocialPanel };
