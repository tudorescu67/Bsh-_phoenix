/* by Capitanul burcea,alex */
const db = require('./database');

const inviteCache = new Map();
const FAKE_ACCOUNT_DAYS = Math.max(0, Number(process.env.INVITE_FAKE_ACCOUNT_DAYS || 3));

function getKey(guildId, userId) {
  return `${guildId}_${userId}`;
}

function defaultStats() {
  return { invites: 0, left: 0, fake: 0, bonus: 0 };
}

function realCount(stats) {
  return Math.max(0, Number(stats.invites || 0) - Number(stats.left || 0) - Number(stats.fake || 0) + Number(stats.bonus || 0));
}

function isFakeMember(member) {
  if (!FAKE_ACCOUNT_DAYS) return false;
  return Date.now() - Number(member.user.createdTimestamp || Date.now()) < FAKE_ACCOUNT_DAYS * 24 * 60 * 60 * 1000;
}

async function cacheInvites(guild) {
  try {
    const invites = await guild.invites.fetch();
    inviteCache.set(guild.id, new Map(invites.map((invite) => [invite.code, Number(invite.uses || 0)])));
    return true;
  } catch (err) {
    console.warn(`[Invites] Nu pot citi invite-urile pentru ${guild.name}: ${err.message}`);
    return false;
  }
}

async function onMemberJoin(member) {
  const guild = member.guild;
  const oldCache = inviteCache.get(guild.id) || new Map();
  let invites;

  try {
    invites = await guild.invites.fetch();
  } catch (err) {
    console.warn(`[Invites] Fetch join failed: ${err.message}`);
    return null;
  }

  inviteCache.set(guild.id, new Map(invites.map((invite) => [invite.code, Number(invite.uses || 0)])));
  const used = invites.find((invite) => Number(invite.uses || 0) > Number(oldCache.get(invite.code) || 0));
  if (!used?.inviter) return { inviter: null, invite: null, reason: 'unknown' };

  const key = getKey(guild.id, used.inviter.id);
  const stats = { ...defaultStats(), ...(db.get('invite_stats', key) || {}) };
  stats.invites = Number(stats.invites || 0) + 1;
  if (isFakeMember(member)) stats.fake = Number(stats.fake || 0) + 1;
  stats.updatedAt = Date.now();

  db.set('invite_stats', key, stats);
  db.set('invite_who', getKey(guild.id, member.id), {
    inviterId: used.inviter.id,
    inviteCode: used.code,
    joinedAt: Date.now(),
    leftAt: null,
  });

  return { inviter: used.inviter, invite: used, fake: isFakeMember(member) };
}

async function onMemberLeave(member) {
  const whoKey = getKey(member.guild.id, member.id);
  const who = db.get('invite_who', whoKey);
  const inviterId = typeof who === 'string' ? who : who?.inviterId;
  if (!inviterId || who?.leftAt) return null;

  const key = getKey(member.guild.id, inviterId);
  const stats = { ...defaultStats(), ...(db.get('invite_stats', key) || {}) };
  stats.left = Number(stats.left || 0) + 1;
  stats.updatedAt = Date.now();
  db.set('invite_stats', key, stats);
  db.set('invite_who', whoKey, { ...(typeof who === 'object' ? who : {}), inviterId, leftAt: Date.now() });
  return inviterId;
}

function getInviteStats(guildId, userId) {
  const stats = { ...defaultStats(), ...(db.get('invite_stats', getKey(guildId, userId)) || {}) };
  return { ...stats, real: realCount(stats) };
}

function getInviteTop(guildId, limit = 10) {
  return Object.entries(db.getAll('invite_stats') || {})
    .filter(([key]) => key.startsWith(`${guildId}_`))
    .map(([key, stats]) => {
      const userId = key.slice(`${guildId}_`.length);
      return { userId, ...stats, real: realCount(stats) };
    })
    .sort((a, b) => b.real - a.real)
    .slice(0, limit);
}

module.exports = {
  cacheInvites,
  refreshInviteCache: cacheInvites,
  onMemberJoin,
  onMemberLeave,
  getInviteStats,
  getInviteTop,
};
