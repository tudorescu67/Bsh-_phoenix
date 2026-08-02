/* by Capitanul burcea,alex */
const db = require('./database');
const { sendLog, recordAction } = require('./logger');

const limits = new Map();

async function checkNuke(guild, executorId, type) {
  if (!guild || !executorId || executorId === guild.ownerId) return;

  const member = await guild.members.fetch(executorId).catch(() => null);
  if (!member || member.user.bot) return;

  const config = db.get('antiraid_config', guild.id) || {
    nuke: true,
    limit: 3,
    windowMs: 60000,
    action: 'remove_roles',
    bypassRoleId: null,
  };
  if (!config.nuke) return;
  if (config.bypassRoleId && member.roles.cache.has(config.bypassRoleId)) return;

  const now = Date.now();
  const key = `${guild.id}:${executorId}`;
  if (!limits.has(key)) limits.set(key, { channels: [], roles: [], bans: [] });

  const history = limits.get(key);
  history[type] ||= [];
  history[type].push(now);
  history[type] = history[type].filter((timestamp) => now - timestamp < Number(config.windowMs || 60000));

  if (history[type].length < Number(config.limit || 3)) return;

  const action = config.action || 'remove_roles';
  let status = 'alerted';
  let detail = 'Doar alerta.';

  try {
    if (action === 'remove_roles') {
      const rolesToKeep = member.roles.cache.filter((role) => role.managed);
      await member.roles.set(rolesToKeep, 'Anti-Nuke triggered');
      status = 'roles_removed';
      detail = 'Rolurile au fost eliminate.';
    } else if (action === 'timeout') {
      await member.timeout(10 * 60 * 1000, 'Anti-Nuke triggered');
      status = 'timeout';
      detail = 'Timeout 10 minute aplicat.';
    } else if (action === 'kick') {
      await member.kick('Anti-Nuke triggered');
      status = 'kicked';
      detail = 'Membrul a fost kickuit.';
    } else if (action === 'ban') {
      await member.ban({ reason: 'Anti-Nuke triggered' });
      status = 'banned';
      detail = 'Membrul a fost banat.';
    }

    await sendLog(guild, 'antiraid', {
      title: 'ANTI-NUKE ACTIVAT',
      description: `Utilizatorul ${member} a depasit regula Anti-Nuke.`,
      extra: `Actiune detectata: **${type.toUpperCase()}** (${history[type].length}/${config.limit} in ${Math.round((config.windowMs || 60000) / 1000)}s)\nSanctiune: **${status}**\n${detail}`,
      color: 0xff0000,
    });

    await recordAction(guild, {
      type: 'antiraid',
      action: 'antiraid.nuke-trigger',
      actorId: executorId,
      target: type,
      status,
      metadata: {
        count: history[type].length,
        limit: config.limit,
        windowMs: config.windowMs,
        action,
      },
    });
  } catch (err) {
    console.error('Anti-Nuke Action Error:', err);
    await recordAction(guild, {
      type: 'antiraid',
      action: 'antiraid.nuke-error',
      actorId: executorId,
      target: type,
      status: 'error',
      metadata: { error: err.message, action },
    });
  } finally {
    limits.delete(key);
  }
}

module.exports = { checkNuke };
