/* by Capitanul burcea,alex */
const { PermissionFlagsBits } = require('discord.js');
const db = require('./database');

const STORE = 'camera_only_channels';
const timers = new Map();

function key(guildId, channelId) {
  return `${guildId}_${channelId}`;
}

function timerKey(guildId, userId) {
  return `${guildId}_${userId}`;
}

function setCameraOnly({ guildId, channelId, graceSeconds = 30, noticeChannelId = null, exemptRoleId = null }) {
  const rule = {
    guildId,
    channelId,
    graceSeconds: Math.max(5, Math.min(300, Number(graceSeconds) || 30)),
    noticeChannelId,
    exemptRoleId,
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const existing = db.get(STORE, key(guildId, channelId));
  db.set(STORE, key(guildId, channelId), { ...existing, ...rule });
  return rule;
}

function removeCameraOnly(guildId, channelId) {
  const id = key(guildId, channelId);
  const existing = db.get(STORE, id);
  if (!existing) return false;
  db.del(STORE, id);
  return true;
}

function getRule(guildId, channelId) {
  return db.get(STORE, key(guildId, channelId));
}

function listCameraOnly(guildId) {
  return Object.values(db.getAll(STORE) || {})
    .filter((rule) => rule && String(rule.guildId) === String(guildId))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function clearTimer(guildId, userId) {
  const id = timerKey(guildId, userId);
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
}

async function sendNotice(state, rule, content) {
  const noticeChannel = rule.noticeChannelId
    ? state.guild.channels.cache.get(rule.noticeChannelId) || await state.guild.channels.fetch(rule.noticeChannelId).catch(() => null)
    : null;

  if (noticeChannel?.isTextBased?.()) return noticeChannel.send({ content }).catch(() => {});
  if (state.channel?.send) return state.channel.send({ content }).catch(() => {});
  return state.member?.send({ content }).catch(() => {});
}

function isExempt(member, rule) {
  return member.permissions?.has?.(PermissionFlagsBits.ManageGuild)
    || (rule.exemptRoleId && member.roles.cache.has(rule.exemptRoleId));
}

async function handleVoiceState(oldState, newState) {
  const guild = newState.guild || oldState.guild;
  const member = newState.member || oldState.member;
  if (!guild || !member || member.user.bot) return;

  if (!newState.channelId) {
    clearTimer(guild.id, member.id);
    return;
  }

  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    clearTimer(guild.id, member.id);
  }

  const rule = getRule(guild.id, newState.channelId);
  if (!rule?.enabled || newState.selfVideo || isExempt(member, rule)) {
    clearTimer(guild.id, member.id);
    return;
  }

  const id = timerKey(guild.id, member.id);
  if (timers.has(id)) return;

  const seconds = Math.max(5, Math.min(300, Number(rule.graceSeconds) || 30));
  await sendNotice(newState, rule, `${member}, in <#${newState.channelId}> camera este obligatorie. Ai **${seconds}s** sa o pornesti sau vei fi scos din voice.`);

  timers.set(id, setTimeout(async () => {
    try {
      const freshMember = await guild.members.fetch(member.id).catch(() => null);
      const voice = freshMember?.voice;
      if (!voice || voice.channelId !== String(rule.channelId) || voice.selfVideo) return;

      await voice.disconnect('Camera obligatorie pe canal camera-only').catch(() => {});
      await sendNotice(newState, rule, `${member} a fost scos din <#${rule.channelId}> pentru ca nu a pornit camera in ${seconds}s.`);
    } finally {
      clearTimer(guild.id, member.id);
    }
  }, seconds * 1000));
}

module.exports = {
  setCameraOnly,
  removeCameraOnly,
  listCameraOnly,
  handleVoiceState,
};
