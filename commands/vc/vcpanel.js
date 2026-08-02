/* by Capitanul burcea,alex */
/**
 * Comenzi slash suplimentare pentru controlul VC-ului propriu
 * (alternativa la panou cu butoane)
 */
const {
  SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
  ActionRowBuilder, UserSelectMenuBuilder, ChannelType, MessageFlags,
} = require('discord.js');
const db = require('../../utils/database');

function getOwnerVC(guildId, userId) {
  const cfg = db.get('vc_config', guildId);
  if (!cfg?.activeVCs) return null;
  const entry = Object.entries(cfg.activeVCs).find(([, v]) => v.ownerId === userId);
  return entry ? { channelId: entry[0], data: entry[1] } : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('myvc')
    .setDescription('Gestioneaza propriul canal vocal')
    .addSubcommand(s => s.setName('rename')
      .setDescription('Redenumeste canalul tau vocal')
      .addStringOption(o => o.setName('nume').setDescription('Noul nume').setRequired(true).setMaxLength(100)))
    .addSubcommand(s => s.setName('limit')
      .setDescription('Seteaza limita de useri')
      .addIntegerOption(o => o.setName('numar').setDescription('Limita (0 = nelimitat)').setMinValue(0).setMaxValue(99).setRequired(true)))
    .addSubcommand(s => s.setName('lock')
      .setDescription('Blocheaza canalul (nu mai pot intra useri noi)'))
    .addSubcommand(s => s.setName('unlock')
      .setDescription('Deblocheaza canalul'))
    .addSubcommand(s => s.setName('hide')
      .setDescription('Ascunde canalul de alti useri'))
    .addSubcommand(s => s.setName('show')
      .setDescription('Fa canalul vizibil'))
    .addSubcommand(s => s.setName('permit')
      .setDescription('Permite unui user sa intre')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true)))
    .addSubcommand(s => s.setName('deny')
      .setDescription('Interzice unui user sa intre')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true)))
    .addSubcommand(s => s.setName('kick')
      .setDescription('Kickeaza un user din canalul tau')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true)))
    .addSubcommand(s => s.setName('mute')
      .setDescription('Muteaza un user in canalul tau vocal')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true)))
    .addSubcommand(s => s.setName('unmute')
      .setDescription('Unmuteaza un user in canalul tau vocal')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true)))
    .addSubcommand(s => s.setName('transfer')
      .setDescription('Transfera ownership-ul canalului')
      .addUserOption(o => o.setName('utilizator').setDescription('Noul owner').setRequired(true)))
    .addSubcommand(s => s.setName('info')
      .setDescription('Informatii despre canalul tau vocal')),

  cooldown: 3,

  async execute(interaction) {
    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const userId  = interaction.user.id;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const ownerVC = getOwnerVC(guildId, userId);
    if (!ownerVC) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xed4245).setDescription('❌ Nu ai un canal vocal activ. Intra in canalul **➕ Creeaza Canal** pentru a crea unul.')] });

    const channel = interaction.guild.channels.cache.get(ownerVC.channelId);
    if (!channel) {
      // Curata din DB
      const cfg = db.get('vc_config', guildId);
      if (cfg?.activeVCs) { delete cfg.activeVCs[ownerVC.channelId]; db.set('vc_config', guildId, cfg); }
      return interaction.editReply({ content: '❌ Canalul tau nu mai exista.' });
    }

    // ── RENAME ─────────────────────────────────────────────────────────────────
    if (sub === 'rename') {
      const nume = interaction.options.getString('nume');
      await channel.setName(nume);
      // Update in DB
      const cfg = db.get('vc_config', guildId);
      if (cfg?.activeVCs?.[ownerVC.channelId]) { cfg.activeVCs[ownerVC.channelId].name = nume; db.set('vc_config', guildId, cfg); }
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`✏️ Canalul redenumit: **${nume}**`)] });
    }

    // ── LIMIT ──────────────────────────────────────────────────────────────────
    if (sub === 'limit') {
      const numar = interaction.options.getInteger('numar');
      await channel.setUserLimit(numar);
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`👥 Limita setata: **${numar === 0 ? 'Nelimitat' : numar + ' useri'}**`)] });
    }

    // ── LOCK ───────────────────────────────────────────────────────────────────
    if (sub === 'lock') {
      await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription('🔒 Canalul tau a fost **blocat**. Userii noi nu pot intra.')] });
    }

    // ── UNLOCK ─────────────────────────────────────────────────────────────────
    if (sub === 'unlock') {
      await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: null });
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription('🔓 Canalul tau a fost **deblocat**.')] });
    }

    // ── HIDE ───────────────────────────────────────────────────────────────────
    if (sub === 'hide') {
      await channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription('👻 Canalul tau este acum **ascuns**.')] });
    }

    // ── SHOW ───────────────────────────────────────────────────────────────────
    if (sub === 'show') {
      await channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: null });
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription('👁️ Canalul tau este acum **vizibil**.')] });
    }

    // ── PERMIT ─────────────────────────────────────────────────────────────────
    if (sub === 'permit') {
      const target = interaction.options.getMember('utilizator');
      await channel.permissionOverwrites.edit(target, { Connect: true, ViewChannel: true });
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`✅ ${target} poate acum intra in canalul tau.`)] });
    }

    // ── DENY ───────────────────────────────────────────────────────────────────
    if (sub === 'deny') {
      const target = interaction.options.getMember('utilizator');
      if (target.id === userId) return interaction.editReply({ content: '❌ Nu te poti bloca pe tine.' });
      // Kickeaza daca e in canal
      if (target.voice.channelId === channel.id) await target.voice.setChannel(null).catch(() => {});
      await channel.permissionOverwrites.edit(target, { Connect: false, ViewChannel: false });
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`🚫 ${target} nu mai poate intra in canalul tau.`)] });
    }

    // ── KICK ───────────────────────────────────────────────────────────────────
    if (sub === 'kick') {
      const target = interaction.options.getMember('utilizator');
      if (target.id === userId) return interaction.editReply({ content: '❌ Nu te poti kicka pe tine.' });
      if (target.voice.channelId !== channel.id) return interaction.editReply({ content: '❌ Utilizatorul nu e in canalul tau.' });
      await target.voice.setChannel(null);
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`🚫 ${target} a fost kickat din canalul tau.`)] });
    }

    // ── MUTE ───────────────────────────────────────────────────────────────────
    if (sub === 'mute') {
      const target = interaction.options.getMember('utilizator');
      if (target.id === userId) return interaction.editReply({ content: '❌ Nu te poti muta pe tine.' });
      if (target.voice.channelId !== channel.id) return interaction.editReply({ content: '❌ Utilizatorul nu e in canalul tau.' });
      await target.voice.setMute(true, `Mute de catre owner-ul VC ${interaction.user.tag}`);
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`🔇 ${target} a fost mutat in canalul tau.`)] });
    }

    // ── UNMUTE ─────────────────────────────────────────────────────────────────
    if (sub === 'unmute') {
      const target = interaction.options.getMember('utilizator');
      if (target.voice.channelId !== channel.id) return interaction.editReply({ content: '❌ Utilizatorul nu e in canalul tau.' });
      await target.voice.setMute(false, `Unmute de catre owner-ul VC ${interaction.user.tag}`);
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`🔊 ${target} a fost unmutat in canalul tau.`)] });
    }

    // ── TRANSFER ───────────────────────────────────────────────────────────────
    if (sub === 'transfer') {
      const target = interaction.options.getMember('utilizator');
      if (target.id === userId) return interaction.editReply({ content: '❌ Esti deja owner.' });
      if (target.user.bot) return interaction.editReply({ content: '❌ Nu poti transfera la un bot.' });

      const cfg = db.get('vc_config', guildId);
      if (cfg?.activeVCs?.[ownerVC.channelId]) {
        cfg.activeVCs[ownerVC.channelId].ownerId = target.id;
        db.set('vc_config', guildId, cfg);
      }
      // Update permisiuni
      await channel.permissionOverwrites.edit(userId,    { ManageChannels: false, MoveMembers: false });
      await channel.permissionOverwrites.edit(target.id, { ManageChannels: true,  MoveMembers: true,  Connect: true, ViewChannel: true });
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`👑 Ownership transferat catre ${target}!`)] });
    }

    // ── INFO ───────────────────────────────────────────────────────────────────
    if (sub === 'info') {
      const members = channel.members.map(m => m.toString()).join(', ') || 'Nimeni';
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎙️ ${channel.name}`)
        .addFields(
          { name: '👥 Membri',  value: `${channel.members.size}/${channel.userLimit || '∞'}`, inline: true },
          { name: '🔒 Status', value: channel.permissionOverwrites.cache.get(interaction.guild.id)?.deny.has(PermissionFlagsBits.Connect) ? 'Blocat' : 'Deschis', inline: true },
          { name: '👁️ Vizibil', value: channel.permissionOverwrites.cache.get(interaction.guild.id)?.deny.has(PermissionFlagsBits.ViewChannel) ? 'Ascuns' : 'Vizibil', inline: true },
          { name: '🎤 In canal', value: members },
        );
      return interaction.editReply({ embeds: [embed] });
    }
  },
};

module.exports.getOwnerVC = getOwnerVC;
