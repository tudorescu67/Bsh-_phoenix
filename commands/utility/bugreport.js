/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bugreport')
    .setDescription('Raportează un bug întâlnit pe server sau la bot'),
  
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('bug_report_modal')
      .setTitle('📝 Raportare Bug Phoenix');

    const titleInput = new TextInputBuilder()
      .setCustomId('bug_title')
      .setLabel('Titlu Bug')
      .setPlaceholder('ex: Comanda /play nu merge')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const descInput = new TextInputBuilder()
      .setCustomId('bug_description')
      .setLabel('Descriere Detaliată')
      .setPlaceholder('Descrie ce s-a întâmplat și cum putem reproduce bug-ul...')
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descInput)
    );

    await interaction.showModal(modal);
  },

  async handleModal(interaction) {
    const title = interaction.fields.getTextInputValue('bug_title');
    const description = interaction.fields.getTextInputValue('bug_description');
    
    const bugId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const bugData = {
      id: bugId,
      user: interaction.user.id,
      tag: interaction.user.tag,
      title,
      description,
      timestamp: Date.now(),
      status: 'pending'
    };

    db.set('bugs', `${interaction.guild.id}_${bugId}`, bugData);

    // Log to bug channel if configured
    const config = db.get('log_config', interaction.guild.id);
    const bugChannelId = config?.channels?.bugs || config?.channelId;
    if (bugChannelId) {
      const channel = interaction.guild.channels.cache.get(bugChannelId);
      if (channel) {
        const logEmbed = new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle(`🐛 Bug Report Nou: #${bugId}`)
          .addFields(
            { name: '👤 Raportat de', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
            { name: '📌 Titlu', value: title, inline: true },
            { name: '📝 Descriere', value: description }
          )
          .setTimestamp();
        await channel.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }

    await interaction.reply({ content: `✅ Bug-ul a fost raportat cu succes! ID: **#${bugId}**. Mulțumim pentru ajutor!`, flags: MessageFlags.Ephemeral });
  }
};
