/* by Capitanul burcea,alex */
const db = require('./database');
const { sendLog } = require('./logger');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const joinLog = new Map(); // guildId -> Array of timestamps

module.exports = {
  async checkMember(member) {
    const guild = member.guild;
    const cfg = db.get('antiraid', guild.id) || {
      enabled: false,
      limit: 5,         // max joins
      window: 10000,    // in 10 seconds
      minAge: 24 * 60,  // 24 hours in minutes
      action: 'kick'    // kick, ban, or alert
    };

    if (!cfg.enabled) return;

    // 1. Account Age Check
    const accountAge = (Date.now() - member.user.createdTimestamp) / (1000 * 60);
    if (accountAge < cfg.minAge) {
      await this.takeAction(member, `Cont prea nou (${Math.floor(accountAge)} min < ${cfg.minAge} min)`, cfg.action);
      return;
    }

    // 2. Join Velocity Check
    const now = Date.now();
    let joins = joinLog.get(guild.id) || [];
    joins = joins.filter(ts => now - ts < cfg.window);
    joins.push(now);
    joinLog.set(guild.id, joins);

    if (joins.length > cfg.limit) {
      await this.handleRaid(guild, member, cfg);
    }
  },

  async handleRaid(guild, triggerMember, cfg) {
    // If a raid is detected, we could lock the server or notify admins
    await sendLog(guild, 'antiraid', {
      title: '🚨 RAID DETECTAT!',
      description: `S-a detectat o viteză mare de join-uri: **${cfg.limit} useri** în **${cfg.window / 1000}s**.`,
      extra: `Trigger member: ${triggerMember.user.tag}`,
      color: 0xff0000
    });

    // Optional: Lock the server by disabling SendMessages for @everyone in all channels
    // This is a heavy action, maybe just alert for now unless configured otherwise
  },

  async takeAction(member, reason, action) {
    try {
      await member.send(`Ai fost scos de pe **${member.guild.name}** pentru: ${reason}`).catch(() => {});
      
      if (action === 'kick') {
        await member.kick(reason);
      } else if (action === 'ban') {
        await member.ban({ reason });
      }

      await sendLog(member.guild, 'antiraid_action', {
        title: '🛡️ Acțiune Anti-Raid',
        user: member.user,
        description: `Acțiune: **${action.toUpperCase()}**`,
        extra: `Motiv: ${reason}`,
        color: 0xffa500
      });
    } catch (err) {
      console.error('Anti-Raid Action Error:', err);
    }
  }
};
