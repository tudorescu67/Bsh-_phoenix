/* by Capitanul burcea,alex */
/**
 * Logger util - trimite log-uri formatate intr-un canal de logs configurat
 */
const { EmbedBuilder } = require('discord.js');
const db = require('./database');

const LOG_COLORS = {
  ban:        0xed4245,
  unban:      0x57f287,
  kick:       0xff6b35,
  warn:       0xfee75c,
  timeout:    0xff9500,
  untimeout:  0x57f287,
  clear:      0x5865f2,
  lock:       0xed4245,
  unlock:     0x57f287,
  mute:       0xff6b35,
  role_add:   0x57f287,
  role_remove:0xed4245,
  nickname:   0x5865f2,
  member_join:0x57f287,
  member_leave:0xed4245,
  message_delete: 0xed4245,
  message_edit:   0xfee75c,
  voice_join:     0x57f287,
  voice_leave:    0xed4245,
  voice_move:     0x5865f2,
  channel_create: 0x57f287,
  channel_delete: 0xed4245,
  channel_update: 0xfee75c,
  role_create:    0x57f287,
  role_delete:    0xed4245,
  ticket_open:    0x5865f2,
  ticket_close:   0xed4245,
  apply:          0x5865f2,
  verify:         0x57f287,
  invite:         0x5865f2,
  boost:         0xff73fa,
  info:          0x5865f2,
  staff:         0x9b59b6,
  error:         0xff0000,
  antiraid:      0xff0000,
  antiraid_action: 0xffa500,
  action:        0x00aeef,
  giveaway:      0xfee75c,
};

const LOG_EMOJIS = {
  ban:        '🔨',
  unban:      '✅',
  kick:       '👢',
  warn:       '⚠️',
  timeout:    '⏱️',
  untimeout:  '✅',
  clear:      '🗑️',
  lock:       '🔒',
  unlock:     '🔓',
  role_add:   '➕',
  role_remove:'➖',
  nickname:   '✏️',
  member_join:'📥',
  member_leave:'📤',
  message_delete:'🗑️',
  message_edit:  '✏️',
  voice_join:    '🎙️',
  voice_leave:   '🎙️',
  voice_move:    '🔀',
  channel_create:'📁',
  channel_delete:'📁',
  channel_update:'📁',
  role_create:   '🏷️',
  role_delete:   '🏷️',
  ticket_open:   '🎫',
  ticket_close:  '🎫',
  apply:         '📋',
  verify:        '✅',
  invite:        '📨',
  boost:         '🚀',
  info:          'ℹ️',
  staff:         '👮',
  error:         '❌',
  antiraid:      '🛡️',
  antiraid_action: '🛡️',
};

/**
 * Trimite un log intr-un canal configurat
 * @param {Guild} guild
 * @param {string} type - tipul de log (ban, kick, message_delete, etc.)
 * @param {Object} fields - campurile embed-ului
 */
async function sendLog(guild, type, fields = {}) {
  try {
    const cfg = db.get('log_config', guild.id);
    if (!cfg) return;

    // Verifica daca tipul este activat
    const category = getCategory(type);
    if (cfg.disabled?.includes(type) || cfg.disabled?.includes(category)) return;

    // Alege canalul: specific tip > specific categorie > general
    const channelId = cfg.channels?.[type] || cfg.channels?.[category] || cfg.categories?.[type] || cfg.categories?.[category] || cfg.channelId;
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const emoji = LOG_EMOJIS[type] || 'ℹ️';
    const color = LOG_COLORS[type] || 0x5865f2;
    const title = fields.title || `${emoji} ${formatType(type)}`;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setTimestamp();

    if (fields.description) embed.setDescription(fields.description);
    if (fields.thumbnail) embed.setThumbnail(fields.thumbnail);
    if (fields.footer) embed.setFooter({ text: fields.footer });

    const embedFields = [];
    if (fields.user) embedFields.push({ name: '👤 Utilizator', value: `${fields.user} (${fields.user?.id || fields.userId || '?'})`, inline: true });
    if (fields.moderator) embedFields.push({ name: '🛡️ Moderator', value: `${fields.moderator}`, inline: true });
    if (fields.reason) embedFields.push({ name: '📝 Motiv', value: fields.reason, inline: false });
    if (fields.channel) embedFields.push({ name: '📌 Canal', value: `${fields.channel}`, inline: true });
    if (fields.duration) embedFields.push({ name: '⏱️ Durata', value: fields.duration, inline: true });
    if (fields.count !== undefined) embedFields.push({ name: '🔢 Numar', value: `${fields.count}`, inline: true });
    if (fields.before) embedFields.push({ name: '📄 Inainte', value: fields.before.slice(0, 1024), inline: false });
    if (fields.after) embedFields.push({ name: '📄 Dupa', value: fields.after.slice(0, 1024), inline: false });
    if (fields.extra) embedFields.push({ name: '📋 Detalii', value: fields.extra, inline: false });

    // Campuri custom aditionale
    if (fields.fields) embedFields.push(...fields.fields);

    if (embedFields.length > 0) embed.addFields(embedFields);

    await channel.send({ embeds: [embed] });
  } catch (err) {
    // Silently fail - nu sparge botul daca logs nu merg
    console.error('[Logger Error]', err.message);
  }
}

async function recordAction(guild, input = {}) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    guildId: guild?.id || input.guildId || null,
    actorId: input.actor?.id || input.actorId || null,
    actorTag: input.actor?.tag || input.actorTag || null,
    action: String(input.action || 'unknown').slice(0, 120),
    target: input.target ? String(input.target).slice(0, 200) : null,
    status: input.status || 'success',
    metadata: input.metadata || {},
    createdAt: new Date().toISOString(),
  };

  try {
    const logs = db.getAll('action_logs') || {};
    const guildId = entry.guildId || 'global';
    logs[guildId] = [entry, ...(logs[guildId] || [])].slice(0, Number(process.env.ACTION_LOG_MAX || 1000));
    db.save('action_logs', logs);
  } catch (err) {
    console.error('[ActionLog DB Error]', err.message);
  }

  if (guild && input.discord !== false) {
    await sendLog(guild, input.type || 'action', {
      title: input.title || `Action: ${entry.action}`,
      description: input.description || `Status: **${entry.status}**${entry.target ? `\nTarget: \`${entry.target}\`` : ''}`,
      user: input.actor,
      extra: input.extra || (Object.keys(entry.metadata).length ? `\`\`\`json\n${JSON.stringify(entry.metadata, null, 2).slice(0, 900)}\n\`\`\`` : undefined),
    }).catch(() => {});
  }

  return entry;
}

function getCategory(type) {
  if (['ban','unban','kick','warn','timeout','untimeout','clear','lock','unlock'].includes(type)) return 'moderation';
  if (['member_join','member_leave'].includes(type)) return 'members';
  if (['message_delete','message_edit'].includes(type)) return 'messages';
  if (['voice_join','voice_leave','voice_move'].includes(type)) return 'voice';
  if (['channel_create','channel_delete','channel_update'].includes(type)) return 'server';
  if (['role_create','role_delete','role_add','role_remove'].includes(type)) return 'server';
  if (['ticket_open','ticket_close'].includes(type)) return 'tickets';
  if (['apply','verify'].includes(type)) return 'utility';
  if (['staff','antiraid','antiraid_action','action','giveaway'].includes(type)) return 'staff';
  if (['error'].includes(type)) return 'errors';
  return 'general';
}

function formatType(type) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = { sendLog, recordAction };
