/* by Capitanul burcea,alex */
/**
 * /vcadmin — Comenzi de admin pentru gestionarea VC-urilor active
 */
const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, MessageFlags,
} = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vcadmin')
    .setDescription('Administreaza VC-urile temporare (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(s => s.setName('list')
      .setDescription('Lista tuturor VC-urilor active'))
    .addSubcommand(s => s.setName('delete')
      .setDescription('Sterge fortat un VC activ')
      .addChannelOption(o => o.setName('canal').setDescription('Canalul de sters').setRequired(true).addChannelTypes(ChannelType.GuildVoice)))
    .addSubcommand(s => s.setName('transfer')
      .setDescription('Transfera ownership-ul unui VC')
      .addChannelOption(o => o.setName('canal').setDescription('Canalul VC').setRequired(true).addChannelTypes(ChannelType.GuildVoice))
      .addUserOption(o => o.setName('nou_owner').setDescription('Noul owner').setRequired(true)))
    .addSubcommand(s => s.setName('control_channel')
      .setDescription('Seteaza canalul text pentru panoul de control VC')
      .addChannelOption(o => o.setName('canal').setDescription('Canalul text').setRequired(true).addChannelTypes(ChannelType.GuildText))),

  cooldown: 3,

  async execute(interaction) {
    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const cfg     = db.get('vc_config', guildId);

    if (!cfg) return interaction.reply({ content: '❌ Sistemul VC nu e configurat. Ruleaza `/vc setup`.', flags: MessageFlags.Ephemeral });

    // ── LIST ───────────────────────────────────────────────────────────────────
    if (sub === 'list') {
      const active = cfg.activeVCs ?? {};
      const entries = Object.entries(active);
      if (!entries.length) return interaction.reply({ content: '📭 Nu exista VC-uri active momentan.', flags: MessageFlags.Ephemeral });

      const lines = entries.map(([chId, data]) => {
        const ch     = interaction.guild.channels.cache.get(chId);
        const owner  = interaction.guild.members.cache.get(data.ownerId);
        const dur    = Math.floor((Date.now() - data.createdAt) / 60000);
        return `<#${chId}> — Owner: **${owner?.displayName ?? 'Necunoscut'}** — ${ch?.members.size ?? 0} useri — ${dur}min`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎙️ VC-uri active: ${entries.length}`)
        .setDescription(lines.join('\n'));

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────
    if (sub === 'delete') {
      const canal = interaction.options.getChannel('canal');
      if (!cfg.activeVCs?.[canal.id]) return interaction.reply({ content: '❌ Acesta nu e un VC temporar activ.', flags: MessageFlags.Ephemeral });
      delete cfg.activeVCs[canal.id];
      db.set('vc_config', guildId, cfg);
      await canal.delete('Sters de admin').catch(() => {});
      return interaction.reply({ content: `✅ VC-ul **${canal.name}** a fost sters.`, flags: MessageFlags.Ephemeral });
    }

    // ── TRANSFER ───────────────────────────────────────────────────────────────
    if (sub === 'transfer') {
      const canal    = interaction.options.getChannel('canal');
      const nouOwner = interaction.options.getMember('nou_owner');
      if (!cfg.activeVCs?.[canal.id]) return interaction.reply({ content: '❌ Acesta nu e un VC temporar activ.', flags: MessageFlags.Ephemeral });

      const oldOwnerId = cfg.activeVCs[canal.id].ownerId;
      cfg.activeVCs[canal.id].ownerId = nouOwner.id;
      db.set('vc_config', guildId, cfg);

      await canal.permissionOverwrites.edit(oldOwnerId, { ManageChannels: null, MoveMembers: null }).catch(() => {});
      await canal.permissionOverwrites.edit(nouOwner.id, { ManageChannels: true, MoveMembers: true, Connect: true, ViewChannel: true }).catch(() => {});

      return interaction.reply({ content: `✅ Ownership transferat catre ${nouOwner} pentru **${canal.name}**.`, flags: MessageFlags.Ephemeral });
    }

    // ── CONTROL CHANNEL ────────────────────────────────────────────────────────
    if (sub === 'control_channel') {
      const canal = interaction.options.getChannel('canal');
      cfg.controlTextChannelId = canal.id;
      db.set('vc_config', guildId, cfg);
      return interaction.reply({ content: `✅ Panoul de control VC va fi trimis in ${canal}.`, flags: MessageFlags.Ephemeral });
    }
  },
};
