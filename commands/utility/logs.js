/* by Capitanul burcea,alex */
const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
  ChannelType, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags
} = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Sistem de logs pentru actiuni pe server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s
      .setName('setup')
      .setDescription('Configureaza canalul principal de logs')
      .addChannelOption(o => o.setName('canal').setDescription('Canalul pentru toate log-urile').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(s => s
      .setName('canal')
      .setDescription('Seteaza canal separat pentru o categorie de log-uri')
      .addStringOption(o => o.setName('categorie').setDescription('Categoria de log-uri').setRequired(true).addChoices(
        { name: '🛡️ Moderare (ban, kick, warn, timeout...)', value: 'moderation' },
        { name: '👥 Membri (join/leave)', value: 'members' },
        { name: '💬 Mesaje (sterse, editate)', value: 'messages' },
        { name: '🎙️ Voce (join/leave/move)', value: 'voice' },
        { name: '⚙️ Server (canale, roluri)', value: 'server' },
        { name: '🎫 Tickete', value: 'tickets' },
        { name: '📋 Utility (apply, verify)', value: 'utility' },
        { name: '👮 Staff (antiraid, staff actions)', value: 'staff' },
        { name: '❌ Erori Bot', value: 'errors' },
        { name: '🐛 Bug Reports', value: 'bugs' },
      ))
      .addChannelOption(o => o.setName('canal').setDescription('Canalul pentru aceasta categorie').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(s => s
      .setName('disable')
      .setDescription('Dezactiveaza un tip de log')
      .addStringOption(o => o.setName('tip').setDescription('Tipul de log de dezactivat').setRequired(true).addChoices(
        { name: 'ban', value: 'ban' },
        { name: 'unban', value: 'unban' },
        { name: 'kick', value: 'kick' },
        { name: 'warn', value: 'warn' },
        { name: 'timeout', value: 'timeout' },
        { name: 'clear', value: 'clear' },
        { name: 'lock / unlock', value: 'lock' },
        { name: 'member_join', value: 'member_join' },
        { name: 'member_leave', value: 'member_leave' },
        { name: 'message_delete', value: 'message_delete' },
        { name: 'message_edit', value: 'message_edit' },
        { name: 'voice_join / leave', value: 'voice_join' },
        { name: 'role_add / remove', value: 'role_add' },
        { name: 'nickname', value: 'nickname' },
        { name: 'channel_create / delete', value: 'channel_create' },
        { name: 'ticket_open / close', value: 'ticket_open' },
        { name: 'verify', value: 'verify' },
        { name: 'apply', value: 'apply' },
        { name: 'boost', value: 'boost' },
      ))
    )
    .addSubcommand(s => s
      .setName('enable')
      .setDescription('Reactiveaza un tip de log dezactivat')
      .addStringOption(o => o.setName('tip').setDescription('Tipul de log').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('status')
      .setDescription('Afiseaza configuratia curenta de logs')
    )
    .addSubcommand(s => s
      .setName('reset')
      .setDescription('Reseteaza toata configuratia de logs')
    ),

  cooldown: 5,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── SETUP ──────────────────────────────────────────────
    if (sub === 'setup') {
      const canal = interaction.options.getChannel('canal');
      const existing = db.get('log_config', interaction.guild.id) || {};
      db.set('log_config', interaction.guild.id, { ...existing, channelId: canal.id });

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('📋 Sistem de Logs Configurat!')
        .setDescription(`Toate log-urile vor fi trimise in ${canal}.\n\nPoți seta canale **separate** pentru fiecare categorie cu \`/logs canal\`.\nVerifică statusul cu \`/logs status\`.`)
        .addFields(
          { name: '🛡️ Moderare', value: 'ban, kick, warn, timeout, clear, lock', inline: true },
          { name: '👥 Membri', value: 'join, leave, boost', inline: true },
          { name: '💬 Mesaje', value: 'sterse, editate', inline: true },
          { name: '🎙️ Voce', value: 'join, leave, move', inline: true },
          { name: '⚙️ Server', value: 'canale, roluri, nickname', inline: true },
          { name: '🎫 Tickete', value: 'deschise, inchise', inline: true },
          { name: '📋 Utility', value: 'apply, verify', inline: true },
          { name: '👮 Staff', value: 'antiraid, staff actions', inline: true },
          { name: '❌ Erori', value: 'erori bot', inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // ── CANAL SEPARAT ──────────────────────────────────────
    if (sub === 'canal') {
      const cat = interaction.options.getString('categorie');
      const canal = interaction.options.getChannel('canal');
      const cfg = db.get('log_config', interaction.guild.id) || {};
      
      if (!cfg.categories) cfg.categories = {};
      cfg.categories[cat] = canal.id;
      db.set('log_config', interaction.guild.id, cfg);

      return interaction.reply({ 
        content: `✅ Log-urile din categoria **${cat}** vor fi trimise acum în ${canal}.`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ── DISABLE ────────────────────────────────────────────
    if (sub === 'disable') {
      const tip = interaction.options.getString('tip');
      const cfg = db.get('log_config', interaction.guild.id);
      if (!cfg) return interaction.reply({ content: '❌ Logs nu sunt configurate. Foloseste `/logs setup` mai intai.', flags: MessageFlags.Ephemeral });

      if (!cfg.disabled) cfg.disabled = [];
      if (!cfg.disabled.includes(tip)) cfg.disabled.push(tip);
      db.set('log_config', interaction.guild.id, cfg);

      return interaction.reply({ 
        content: `✅ Tipul de log \`${tip}\` a fost **dezactivat**.`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ── ENABLE ─────────────────────────────────────────────
    if (sub === 'enable') {
      const tip = interaction.options.getString('tip');
      const cfg = db.get('log_config', interaction.guild.id);
      if (!cfg) return interaction.reply({ content: '❌ Logs nu sunt configurate.', flags: MessageFlags.Ephemeral });

      if (cfg.disabled) cfg.disabled = cfg.disabled.filter(t => t !== tip);
      db.set('log_config', interaction.guild.id, cfg);

      return interaction.reply({ 
        content: `✅ Tipul de log \`${tip}\` a fost **reactivat**.`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    // ── STATUS ─────────────────────────────────────────────
    if (sub === 'status') {
      const cfg = db.get('log_config', interaction.guild.id);
      if (!cfg) return interaction.reply({ content: '❌ Logs nu sunt configurate. Foloseste `/logs setup`.', flags: MessageFlags.Ephemeral });

      const mainChannel = interaction.guild.channels.cache.get(cfg.channelId) || 'Nespecificat';
      const disabled = cfg.disabled?.length > 0 ? cfg.disabled.join(', ') : 'Niciunul';
      
      let catsStr = '';
      if (cfg.categories) {
        for (const [cat, id] of Object.entries(cfg.categories)) {
          catsStr += `• **${cat}**: <#${id}>\n`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📊 Status Configurație Logs')
        .addFields(
          { name: '📍 Canal Principal', value: `${mainChannel}`, inline: true },
          { name: '🚫 Loguri Dezactivate', value: `\`${disabled}\``, inline: true },
          { name: '📂 Canale pe Categorii', value: catsStr || 'Niciunul setat separat' }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // ── RESET ──────────────────────────────────────────────
    if (sub === 'reset') {
      db.delete('log_config', interaction.guild.id);
      return interaction.reply({ 
        content: '✅ Toată configurația de logs a fost resetată.', 
        flags: MessageFlags.Ephemeral 
      });
    }
  },
};
