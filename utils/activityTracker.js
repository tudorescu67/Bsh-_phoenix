/* by Capitanul burcea,alex */
const db = require('./database');

const sessions = new Map(); // `${guildId}:${userId}` -> joinTimestamp

function sessionKey(guildId, userId) {
  return `${guildId || 'global'}:${userId}`;
}

function normalizeStats(stats = {}) {
  return {
    totalMinutes: Number(stats.totalMinutes || 0),
    lastSession: Number(stats.lastSession || 0),
    updatedAt: stats.updatedAt || null,
  };
}

module.exports = {
  onJoin: (userId, guildId = 'global') => {
    sessions.set(sessionKey(guildId, userId), Date.now());
  },

  onLeave: (guildId, userId) => {
    const key = sessionKey(guildId, userId);
    const legacyKey = sessionKey('global', userId);
    const joinTime = sessions.get(key) || sessions.get(legacyKey);
    if (!joinTime) return;

    const durationMs = Date.now() - joinTime;
    const durationMinutes = Math.floor(durationMs / 60000);
    sessions.delete(key);
    sessions.delete(legacyKey);

    if (durationMinutes > 0) {
      const key = `${guildId}_${userId}`;
      const stats = normalizeStats(db.get('activity_stats', key));
      stats.totalMinutes += durationMinutes;
      stats.lastSession = durationMinutes;
      stats.updatedAt = Date.now();
      db.set('activity_stats', key, stats);
    }
  },

  getStats: (guildId, userId) => {
    const key = `${guildId}_${userId}`;
    return normalizeStats(db.get('activity_stats', key));
  },

  getCurrentSessionMinutes: (guildId, userId) => {
    const joinTime = sessions.get(sessionKey(guildId, userId)) || sessions.get(sessionKey('global', userId));
    if (!joinTime) return 0;
    return Math.max(0, Math.floor((Date.now() - joinTime) / 60000));
  },

  getTop: (guildId, limit = 10) => {
    return Object.entries(db.getAll('activity_stats') || {})
      .filter(([key]) => key.startsWith(`${guildId}_`))
      .map(([key, stats]) => ({
        userId: key.slice(`${guildId}_`.length),
        ...normalizeStats(stats),
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, Math.max(1, Math.min(Number(limit) || 10, 25)));
  },
};
