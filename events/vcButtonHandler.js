/* by Capitanul burcea,alex */
/**
 * Handler pentru butoanele panoului de control VC
 * (Separat de interactionCreate pentru claritate)
 */
const {
  PermissionFlagsBits, EmbedBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
  UserSelectMenuBuilder, MessageFlags
} = require('discord.js');
const db = require('../utils/database');

function getOwnerVC(guildId, userId) {
  const cfg = db.get('vc_config', guildId);
  if (!cfg?.activeVCs) return null;
  const entry = Object.entries(cfg.activeVCs).find(([, v]) => v.ownerId === userId);
  return entry ? { channelId: entry[0], data: entry[1] } : null;
}

async function safeShowModal(interaction, modal) {
  try {
    await interaction.showModal(modal);
    return true;
  } catch (err) {
    if (err?.code === 10062 || String(err?.message || '').includes('Unknown interaction')) {
      return false;
    }
    throw err;
  }
}

async function handleVCButton(interaction) {
  if (!interaction.isButton() && !interaction.isUserSelectMenu() && !interaction.isModalSubmit()) return;

  const id      = interaction.customId;
  const guildId = interaction.guild.id;
  const userId  = interaction.user.id;

  // Verifica daca e un buton VC
  const vcButtons = ['vc_lock','vc_unlock','vc_rename','vc_limit','vc_delete','vc_hide','vc_show','vc_transfer','vc_kick','vc_permit','vc_mute','vc_unmute'];
  const isVCModal  = id.startsWith('vc_modal_');
  const isVCSelect = id.startsWith('vc_select_');

  if (!vcButtons.includes(id) && !isVCModal && !isVCSelect) return false;

  const ownerVC = getOwnerVC(guildId, userId);
  if (!ownerVC && !isVCModal && !isVCSelect) {
    await interaction.reply({ content: '❌ Nu ai un canal vocal activ sau nu esti owner-ul lui.', flags: MessageFlags.Ephemeral });
    return true;
  }

  const channel = ownerVC ? interaction.guild.channels.cache.get(ownerVC.channelId) : null;
  const cfg     = db.get('vc_config', guildId);

  // ── LOCK ───────────────────────────────────────────────────────────────────
  if (id === 'vc_lock') {
    if (!channel) return vcNoChannel(interaction);
    await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
    if (cfg?.activeVCs?.[ownerVC.channelId]) { cfg.activeVCs[ownerVC.channelId].locked = true; db.set('vc_config', guildId, cfg); }
    await interaction.reply({ embeds: [ok('🔒 Canalul tau a fost **blocat**.')], flags: MessageFlags.Ephemeral });
    return true;
  }

  // ── UNLOCK ─────────────────────────────────────────────────────────────────
  if (id === 'vc_unlock') {
    if (!channel) return vcNoChannel(interaction);
    await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: null });
    if (cfg?.activeVCs?.[ownerVC.channelId]) { cfg.activeVCs[ownerVC.channelId].locked = false; db.set('vc_config', guildId, cfg); }
    await interaction.reply({ embeds: [ok('🔓 Canalul tau a fost **deblocat**.')], flags: MessageFlags.Ephemeral });
    return true;
  }

  // ── RENAME — deschide modal ────────────────────────────────────────────────
  if (id === 'vc_rename') {
    if (!channel) return vcNoChannel(interaction);
    const modal = new ModalBuilder()
      .setCustomId(`vc_modal_rename_${ownerVC.channelId}`)
      .setTitle('✏️ Redenumeste canalul');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('vc_new_name')
          .setLabel('Noul nume al canalului')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
          .setPlaceholder('ex: 🎮 Gaming cu prietenii')
          .setValue(channel.name)
      )
    );
    await safeShowModal(interaction, modal);
    return true;
  }

  // ── LIMIT — deschide modal ────────────────────────────────────────────────
  if (id === 'vc_limit') {
    if (!channel) return vcNoChannel(interaction);
    const modal = new ModalBuilder()
      .setCustomId(`vc_modal_limit_${ownerVC.channelId}`)
      .setTitle('👥 Seteaza limita de useri');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('vc_limit_val')
          .setLabel('Limita (0 = nelimitat, max 99)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(2)
          .setPlaceholder('ex: 5')
          .setValue(String(channel.userLimit || 0))
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (id === 'vc_delete') {
    if (!channel) return vcNoChannel(interaction);
    await interaction.reply({ content: '🗑️ Canalul se sterge...', flags: MessageFlags.Ephemeral });
    if (cfg?.activeVCs?.[ownerVC.channelId]) { delete cfg.activeVCs[ownerVC.channelId]; db.set('vc_config', guildId, cfg); }
    await channel.delete('Sters de owner').catch(() => {});
    return true;
  }

  // ── HIDE ───────────────────────────────────────────────────────────────────
  if (id === 'vc_hide') {
    if (!channel) return vcNoChannel(interaction);
    await channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
    await interaction.reply({ embeds: [ok('👻 Canalul tau este acum **ascuns**.')], flags: MessageFlags.Ephemeral });
    return true;
  }

  // ── SHOW ───────────────────────────────────────────────────────────────────
  if (id === 'vc_show') {
    if (!channel) return vcNoChannel(interaction);
    await channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: null });
    await interaction.reply({ embeds: [ok('👁️ Canalul tau este acum **vizibil**.')], flags: MessageFlags.Ephemeral });
    return true;
  }

  // ── TRANSFER — deschide user select ───────────────────────────────────────
  if (id === 'vc_transfer') {
    if (!channel) return vcNoChannel(interaction);
    const row = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`vc_select_transfer_${ownerVC.channelId}`)
        .setPlaceholder('Selecteaza noul owner...')
        .setMinValues(1).setMaxValues(1)
    );
    await interaction.reply({ content: '👑 Selecteaza utilizatorul caruia vrei sa ii dai ownership-ul:', components: [row], flags: MessageFlags.Ephemeral });
    return true;
  }

  // ── KICK — deschide user select ────────────────────────────────────────────
  if (id === 'vc_kick') {
    if (!channel) return vcNoChannel(interaction);
    const row = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`vc_select_kick_${ownerVC.channelId}`)
        .setPlaceholder('Selecteaza userul de kickat...')
        .setMinValues(1).setMaxValues(1)
    );
    await interaction.reply({ content: '🚫 Selecteaza utilizatorul de kickat din canal:', components: [row], flags: MessageFlags.Ephemeral });
    return true;
  }

  // ── PERMIT — deschide user select ──────────────────────────────────────────
  if (id === 'vc_permit') {
    if (!channel) return vcNoChannel(interaction);
    const row = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`vc_select_permit_${ownerVC.channelId}`)
        .setPlaceholder('Selecteaza userul de permis...')
        .setMinValues(1).setMaxValues(1)
    );
    await interaction.reply({ content: '✅ Selecteaza utilizatorul caruia vrei sa ii permiti accesul:', components: [row], flags: MessageFlags.Ephemeral });
    return true;
  }

  // ── MUTE — deschide user select ───────────────────────────────────────────
  if (id === 'vc_mute') {
    if (!channel) return vcNoChannel(interaction);
    const row = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`vc_select_mute_${ownerVC.channelId}`)
        .setPlaceholder('Selecteaza userul de mutat...')
        .setMinValues(1).setMaxValues(1)
    );
    await interaction.reply({ content: '🔇 Selecteaza utilizatorul de mutat (voice mute) in canal:', components: [row], flags: MessageFlags.Ephemeral });
    return true;
  }

  // ── UNMUTE — deschide user select ─────────────────────────────────────────
  if (id === 'vc_unmute') {
    if (!channel) return vcNoChannel(interaction);
    const row = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`vc_select_unmute_${ownerVC.channelId}`)
        .setPlaceholder('Selecteaza userul de unmutat...')
        .setMinValues(1).setMaxValues(1)
    );
    await interaction.reply({ content: '🔊 Selecteaza utilizatorul de unmutat (voice unmute) in canal:', components: [row], flags: MessageFlags.Ephemeral });
    return true;
  }

  // ── MODAL SUBMIT: rename ───────────────────────────────────────────────────
  if (id.startsWith('vc_modal_rename_')) {
    const channelId = id.replace('vc_modal_rename_', '');
    const ch = interaction.guild.channels.cache.get(channelId);
    if (!ch) return vcNoChannel(interaction);
    const numeNou = interaction.fields.getTextInputValue('vc_new_name');
    await ch.setName(numeNou);
    const cfgNow = db.get('vc_config', guildId);
    if (cfgNow?.activeVCs?.[channelId]) { cfgNow.activeVCs[channelId].name = numeNou; db.set('vc_config', guildId, cfgNow); }
    await interaction.reply({ embeds: [ok(`✏️ Canal redenumit: **${numeNou}**`)], flags: MessageFlags.Ephemeral });
    return true;
  }

  // ── MODAL SUBMIT: limit ────────────────────────────────────────────────────
  if (id.startsWith('vc_modal_limit_')) {
    const channelId = id.replace('vc_modal_limit_', '');
    const ch = interaction.guild.channels.cache.get(channelId);
    if (!ch) return vcNoChannel(interaction);
    const val = parseInt(interaction.fields.getTextInputValue('vc_limit_val')) || 0;
    const clamped = Math.max(0, Math.min(99, val));
    await ch.setUserLimit(clamped);
    await interaction.reply({ embeds: [ok(`👥 Limita setata: **${clamped === 0 ? 'Nelimitat' : clamped + ' useri'}**`)], flags: MessageFlags.Ephemeral });
    return true;
  }

  // ── USER SELECT: transfer ──────────────────────────────────────────────────
  if (id.startsWith('vc_select_transfer_')) {
    const channelId = id.replace('vc_select_transfer_', '');
    const ch = interaction.guild.channels.cache.get(channelId);
    if (!ch) return vcNoChannel(interaction);
    const targetId = interaction.values[0];
    if (targetId === userId) return interaction.reply({ content: '❌ Esti deja owner.', flags: MessageFlags.Ephemeral });
    const target = interaction.guild.members.cache.get(targetId);
    if (target?.user.bot) return interaction.reply({ content: '❌ Nu poti transfera la un bot.', flags: MessageFlags.Ephemeral });

    const cfgNow = db.get('vc_config', guildId);
    if (cfgNow?.activeVCs?.[channelId]) { cfgNow.activeVCs[channelId].ownerId = targetId; db.set('vc_config', guildId, cfgNow); }
    await ch.permissionOverwrites.edit(userId,   { ManageChannels: null, MoveMembers: null }).catch(() => {});
    await ch.permissionOverwrites.edit(targetId, { ManageChannels: true, MoveMembers: true, Connect: true, ViewChannel: true }).catch(() => {});
    target?.send({ embeds: [ok(`👑 Ai primit ownership-ul canalului **${ch.name}** pe **${interaction.guild.name}**!`)] }).catch(() => {});
    await interaction.update({ content: `✅ Ownership transferat catre ${target}!`, components: [] });
    return true;
  }

  // ── USER SELECT: kick ──────────────────────────────────────────────────────
  if (id.startsWith('vc_select_kick_')) {
    const channelId = id.replace('vc_select_kick_', '');
    const ch = interaction.guild.channels.cache.get(channelId);
    if (!ch) return vcNoChannel(interaction);
    const targetId = interaction.values[0];
      if (targetId === userId) return interaction.reply({ content: '❌ Nu te poti kicka singur.', flags: MessageFlags.Ephemeral });
    const target = interaction.guild.members.cache.get(targetId);
    if (target?.voice?.channelId !== channelId) return interaction.update({ content: '❌ Userul nu e in canalul tau.', components: [] });
    await target.voice.setChannel(null);
    await interaction.update({ content: `✅ ${target} kickat din canal.`, components: [] });
    return true;
  }

  // ── USER SELECT: permit ────────────────────────────────────────────────────
  if (id.startsWith('vc_select_permit_')) {
    const channelId = id.replace('vc_select_permit_', '');
    const ch = interaction.guild.channels.cache.get(channelId);
    if (!ch) return vcNoChannel(interaction);
    const targetId = interaction.values[0];
    const target   = interaction.guild.members.cache.get(targetId);
    await ch.permissionOverwrites.edit(targetId, { Connect: true, ViewChannel: true });
    await interaction.update({ content: `✅ ${target} poate intra acum in canalul tau!`, components: [] });
    return true;
  }

  // ── USER SELECT: mute ──────────────────────────────────────────────────────
  if (id.startsWith('vc_select_mute_')) {
    const channelId = id.replace('vc_select_mute_', '');
    const ch = interaction.guild.channels.cache.get(channelId);
    if (!ch) return vcNoChannel(interaction);
    const targetId = interaction.values[0];
    const target   = interaction.guild.members.cache.get(targetId);
    if (!target) return interaction.update({ content: '❌ Userul nu a fost gasit.', components: [] });
    if (target.voice?.channelId !== channelId) return interaction.update({ content: '❌ Userul nu este in canalul tau.', components: [] });
    
    await target.voice.setMute(true, `Mute de catre owner-ul VC ${interaction.user.tag}`).catch(() => {});
    await interaction.update({ content: `🔇 ${target} a fost mutat in canalul tau.`, components: [] });
    return true;
  }

  // ── USER SELECT: unmute ────────────────────────────────────────────────────
  if (id.startsWith('vc_select_unmute_')) {
    const channelId = id.replace('vc_select_unmute_', '');
    const ch = interaction.guild.channels.cache.get(channelId);
    if (!ch) return vcNoChannel(interaction);
    const targetId = interaction.values[0];
    const target   = interaction.guild.members.cache.get(targetId);
    if (!target) return interaction.update({ content: '❌ Userul nu a fost gasit.', components: [] });
    
    await target.voice.setMute(false, `Unmute de catre owner-ul VC ${interaction.user.tag}`).catch(() => {});
    await interaction.update({ content: `🔊 ${target} a fost unmutat in canalul tau.`, components: [] });
    return true;
  }

  return false;
}

function ok(desc) {
  return new EmbedBuilder().setColor(0x57f287).setDescription(desc);
}

async function vcNoChannel(interaction) {
  const msg = { content: '❌ Canalul nu mai exista.', flags: MessageFlags.Ephemeral };
  if (interaction.replied || interaction.deferred) return interaction.followUp(msg).catch(() => {});
  return interaction.reply(msg).catch(() => {});
}

module.exports = { handleVCButton };
