/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modpanel')
    .setDescription('Deschide un panel de moderare pentru un utilizator')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul de moderat').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getMember('utilizator');
    const user = interaction.options.getUser('utilizator');

    if (!target) {
      return interaction.reply({ content: '❌ Nu am putut găsi acest membru pe server.', flags: MessageFlags.Ephemeral });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Nu te poți modera pe tine însuți.', flags: MessageFlags.Ephemeral });
    }

    if (target.roles.highest.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({ content: '❌ Nu poți modera un utilizator cu rol egal sau mai mare.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🛡️ Panel Moderare: ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Utilizator', value: `${user} (${user.id})`, inline: true },
        { name: '📅 Creat la', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '📥 Intrat la', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: `Moderat de ${interaction.user.tag}` })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`mod_warn_${user.id}`).setLabel('Warn').setEmoji('⚠️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`mod_timeout_${user.id}`).setLabel('Timeout').setEmoji('⏳').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`mod_kick_${user.id}`).setLabel('Kick').setEmoji('👢').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`mod_ban_${user.id}`).setLabel('Ban').setEmoji('🔨').setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`mod_info_${user.id}`).setLabel('User Info').setEmoji('ℹ️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`mod_clear_${user.id}`).setLabel('Șterge Mesaje').setEmoji('🧹').setStyle(ButtonStyle.Primary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('mod_staff_panel').setLabel('Panou Staff').setEmoji('🧰').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2, row3], flags: MessageFlags.Ephemeral });
  },

  async handleButton(interaction) {
    const id = interaction.customId;

    if (id === 'mod_general_panel') {
      const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
      const modal = new ModalBuilder().setCustomId('mod_modal_target').setTitle('Alege Utilizator');
      modal.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('mod_input_user').setLabel('ID Utilizator / Mențiune').setStyle(TextInputStyle.Short).setRequired(true)
      ));
      return interaction.showModal(modal);
    }

    if (id === 'mod_staff_panel') {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🛡️ Panou Staff Phoenix')
        .setDescription('Folosește butoanele de mai jos pentru a accesa rapid uneltele de staff.')
        .addFields(
          { name: '🛡️ Moderare', value: 'Deschide panelul de moderare pentru un membru.', inline: true },
          { name: '🎫 Suport', value: 'Deschide rapid un ticket pentru probleme sau solicitări.', inline: true }
        )
        .setFooter({ text: 'Phoenix Risen • Staff' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('mod_general_panel').setLabel('Moderare').setEmoji('🛡️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_open').setLabel('Ticket suport').setEmoji('🎫').setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    }

    const [prefix, action, userId] = id.split('_');
    if (prefix !== 'mod') return;

    const target = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!target && action !== 'ban') {
      return interaction.reply({ content: '❌ Utilizatorul nu mai este pe server.', flags: MessageFlags.Ephemeral });
    }

    // Verificări permisiuni
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Nu ai permisiunea de a folosi acest panel.', flags: MessageFlags.Ephemeral });
    }

    switch (action) {
      case 'warn':
        // Aici poți deschide un modal pentru motiv
        return interaction.reply({ content: `Folosește \`/warn user:${userId} motiv:...\` pentru moment. (Voi adăuga modal în curând)`, flags: MessageFlags.Ephemeral });
      
      case 'kick':
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) return interaction.reply({ content: '❌ Lipsă permisiuni Kick.', flags: MessageFlags.Ephemeral });
        await target.kick(`Moderat de ${interaction.user.tag}`);
        await sendLog(interaction.guild, 'staff', {
          moderator: interaction.user,
          user: target.user,
          description: `Acțiune: **KICK** via ModPanel`,
          reason: 'Moderat de ' + interaction.user.tag
        });
        return interaction.reply({ content: `✅ **${target.user.tag}** a primit kick.`, flags: MessageFlags.Ephemeral });

      case 'ban':
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply({ content: '❌ Lipsă permisiuni Ban.', flags: MessageFlags.Ephemeral });
        await interaction.guild.members.ban(userId, { reason: `Moderat de ${interaction.user.tag}` });
        await sendLog(interaction.guild, 'staff', {
          moderator: interaction.user,
          userId: userId,
          description: `Acțiune: **BAN** via ModPanel`,
          reason: 'Moderat de ' + interaction.user.tag
        });
        return interaction.reply({ content: `✅ **${userId}** a primit ban.`, flags: MessageFlags.Ephemeral });

      case 'timeout':
        // 10 minute default
        await target.timeout(10 * 60 * 1000, `Moderat de ${interaction.user.tag}`);
        return interaction.reply({ content: `✅ **${target.user.tag}** a primit timeout (10 min).`, flags: MessageFlags.Ephemeral });

      case 'info':
        return interaction.reply({ content: `Informații detaliate: ID ${userId}, Tag: ${target?.user?.tag || 'Necunoscut'}`, flags: MessageFlags.Ephemeral });
      
      case 'clear':
        // Șterge ultimele 50 mesaje ale userului în acest canal
        const msgs = await interaction.channel.messages.fetch({ limit: 100 });
        const userMsgs = msgs.filter(m => m.author.id === userId).first(50);
        await interaction.channel.bulkDelete(userMsgs, true);
        return interaction.reply({ content: `✅ Am șters ultimele mesaje ale lui **${userId}** (max 50).`, flags: MessageFlags.Ephemeral });
    }
  }
};
