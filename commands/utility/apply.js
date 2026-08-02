/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Configurează sistemul de aplicații staff')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName('setup')
        .setDescription('Creează panoul de aplicații')
        .addChannelOption(o => o.setName('canal').setDescription('Canalul unde va fi panoul').setRequired(true))
        .addChannelOption(o => o.setName('logs').setDescription('Canalul unde se trimit aplicațiile').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const canal = interaction.options.getChannel('canal');
      const logs = interaction.options.getChannel('logs');

      db.set('apply_config', interaction.guild.id, {
        logsChannelId: logs.id,
      });

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('Bine ai venit in staful Phoenix')
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setDescription(
          'Vrei sa faci parte din echipa noastra de **staff**?\n\n' +
          'Apasa butonul de mai jos si completeaza formularul de aplicatie. Te vom contacta cat mai curand posibil!\n\n' +
          '**Cerinte minime:**\n' +
          '• Varsta minima: 16 ani\n' +
          '• Activitate constanta pe server\n' +
          '• Comportament respectuos\n' +
          '• Cunostinte de baza in moderare\n\n' +
          '📧 **Procesare**\n' +
          'Aplicatia ta va fi analizata de echipa noastra de staff in 1-3 zile.\n\n' +
          '📬 **Notificare**\n' +
          'Vei primi un DM cu decizia noastra.'
        )
        .setFooter({ text: 'Phoenix Risen Staff Team • Apply System' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('apply_start')
          .setLabel('Aplica acum!')
          .setEmoji('📝')
          .setStyle(ButtonStyle.Success)
      );

      await canal.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Panoul de aplicații a fost creat în ${canal}!`, flags: MessageFlags.Ephemeral });
    }
  },

  async handleApplyButton(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('apply_modal')
      .setTitle('Formular Aplicatie Staff');

    const nameInput = new TextInputBuilder()
      .setCustomId('apply_name')
      .setLabel('Nume si Prenume')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const ageInput = new TextInputBuilder()
      .setCustomId('apply_age')
      .setLabel('Cati ani ai?')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId('apply_reason')
      .setLabel('De ce vrei sa faci parte din staff?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const expInput = new TextInputBuilder()
      .setCustomId('apply_exp')
      .setLabel('Ai mai avut experienta in staff?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const timeInput = new TextInputBuilder()
      .setCustomId('apply_time')
      .setLabel('Cat timp poti dedica serverului?')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(ageInput),
      new ActionRowBuilder().addComponents(reasonInput),
      new ActionRowBuilder().addComponents(expInput),
      new ActionRowBuilder().addComponents(timeInput)
    );

    await interaction.showModal(modal);
  },

  async handleApplyModal(interaction) {
    const name = interaction.fields.getTextInputValue('apply_name');
    const ageStr = interaction.fields.getTextInputValue('apply_age');
    const reason = interaction.fields.getTextInputValue('apply_reason');
    const exp = interaction.fields.getTextInputValue('apply_exp');
    const time = interaction.fields.getTextInputValue('apply_time');

    const age = parseInt(ageStr);

    if (isNaN(age) || age < 16) {
      return interaction.reply({ content: '❌ Ne pare rău, dar vârsta minimă pentru a aplica este de **16 ani**.', flags: MessageFlags.Ephemeral });
    }

    const config = db.get('apply_config', interaction.guild.id);
    if (!config) return interaction.reply({ content: '❌ Sistemul de aplicații nu este configurat!', flags: MessageFlags.Ephemeral });

    const logsChannel = interaction.guild.channels.cache.get(config.logsChannelId);
    if (!logsChannel) return interaction.reply({ content: '❌ Canalul de log-uri pentru aplicații nu a fost găsit!', flags: MessageFlags.Ephemeral });

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle(`📝 Aplicație Staff Nouă - ${interaction.user.tag}`)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Nume', value: name, inline: true },
        { name: '🎂 Vârstă', value: ageStr, inline: true },
        { name: '⏰ Timp disponibil', value: time, inline: true },
        { name: '❓ Motiv', value: reason },
        { name: '🛠️ Experiență', value: exp }
      )
      .setFooter({ text: `ID Utilizator: ${interaction.user.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`apply_accept_${interaction.user.id}`).setLabel('Acceptă').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`apply_deny_${interaction.user.id}`).setLabel('Respinge').setStyle(ButtonStyle.Danger)
    );

    await logsChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Aplicația ta a fost trimisă cu succes! Vei primi un răspuns în curând.', flags: MessageFlags.Ephemeral });
  },

  async handleApplyDecision(interaction) {
    // Încercăm să dăm defer cât mai repede posibil
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
    } catch (e) {
      console.warn('[Apply] Nu s-a putut da defer reply, probabil interacțiunea a expirat deja:', e.message);
    }

    const [action, userId] = interaction.customId.replace('apply_', '').split('_');
    const user = await interaction.client.users.fetch(userId).catch(() => null);

    if (!user) {
      const msg = { content: '❌ Utilizatorul nu a putut fi găsit!' };
      if (interaction.deferred) return interaction.editReply(msg).catch(() => {});
      return interaction.reply({ ...msg, flags: MessageFlags.Ephemeral }).catch(() => {});
    }

    try {
      if (action === 'accept') {
        await user.send(`✅ Felicitări! Aplicația ta pentru staff pe serverul **${interaction.guild.name}** a fost **ACCEPTATĂ**! Te rugăm să contactezi un administrator.`).catch(() => {});
        const msg = { content: `✅ Ai acceptat aplicația lui ${user.tag}.` };
        if (interaction.deferred) await interaction.editReply(msg).catch(() => {});
        else await interaction.reply({ ...msg, flags: MessageFlags.Ephemeral }).catch(() => {});
      } else {
        await user.send(`❌ Ne pare rău, dar aplicația ta pentru staff pe serverul **${interaction.guild.name}** a fost **RESPINSĂ**.`).catch(() => {});
        const msg = { content: `❌ Ai respins aplicația lui ${user.tag}.` };
        if (interaction.deferred) await interaction.editReply(msg).catch(() => {});
        else await interaction.reply({ ...msg, flags: MessageFlags.Ephemeral }).catch(() => {});
      }

      // Dezactivăm butoanele
      const row = ActionRowBuilder.from(interaction.message.components[0]);
      row.components.forEach(c => c.setDisabled(true));
      await interaction.message.edit({ components: [row] }).catch(() => {});
    } catch (err) {
      console.error('[Apply] Eroare în handleApplyDecision:', err);
      const msg = { content: '❌ A apărut o eroare la procesarea deciziei.' };
      if (interaction.deferred) await interaction.editReply(msg).catch(() => {});
      else await interaction.reply({ ...msg, flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
};
