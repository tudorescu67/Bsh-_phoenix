/* by Capitanul burcea,alex */
const db = require('../utils/database');
const { cacheInvites } = require('../utils/inviteTracker');
const cron = require('node-cron');
const jarvisVoice = require('../utils/jarvisVoiceAssistant');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`✅ ${client.user.tag} este online!`);

    // Cache invites for all guilds
    for (const guild of client.guilds.cache.values()) {
      await cacheInvites(guild);
    }

    // --- RE-INITIALIZARE GIVEAWAY-URI ---
    const giveaways = db.getAll('giveaways') || {};
    const { endGiveaway } = require('../utils/giveawayHandler');

    if (typeof endGiveaway !== 'function') {
      console.warn('[Giveaway] endGiveaway nu este exportat; giveaway scheduler sarit.');
    } else {
      for (const [msgId, g] of Object.entries(giveaways)) {
        if (!g.ended) {
          const remaining = g.endTime - Date.now();
          if (remaining > 0) {
            setTimeout(() => endGiveaway(client, msgId).catch(console.error), remaining);
          } else {
            endGiveaway(client, msgId).catch(console.error);
          }
        }
      }
    }

    // Incarca status custom daca exista
    const customStatus = db.get('bot_config', 'status');
    if (customStatus) {
      client.user.setActivity(customStatus.text, { type: customStatus.tip });
    } else {
      const statuses = ['🌐 phoenixrisen.ro', '🛡️ Phoenix Guard', '🎵 Music High Quality', '👑 Capitanul Alex'];
      let i = 0;
      setInterval(() => {
        client.user.setActivity(statuses[i++ % statuses.length], { type: 3 });
      }, 30000);
    }

    if (process.env.JARVIS_VOICE_AUTO_CHANNEL_ID) {
      setTimeout(async () => {
        try {
          const voiceChannel = await client.channels.fetch(process.env.JARVIS_VOICE_AUTO_CHANNEL_ID);
          if (!voiceChannel?.isVoiceBased?.()) {
            console.warn('[Jarvis VC] JARVIS_VOICE_AUTO_CHANNEL_ID nu este voice channel.');
            return;
          }

          const textChannel = process.env.JARVIS_VOICE_AUTO_TEXT_CHANNEL_ID
            ? await client.channels.fetch(process.env.JARVIS_VOICE_AUTO_TEXT_CHANNEL_ID).catch(() => null)
            : voiceChannel.guild.systemChannel;

          await jarvisVoice.join(voiceChannel, textChannel, { client });
          console.log(`[Jarvis VC] Auto-join activ in ${voiceChannel.name}`);
        } catch (err) {
          console.error('[Jarvis VC] Auto-join failed:', err);
        }
      }, Number(process.env.JARVIS_VOICE_AUTO_JOIN_DELAY_MS || 8000));
    }

    // Stats Update Loop (folosind node-cron pentru precizie)
    cron.schedule('*/10 * * * *', async () => {
      console.log('[Stats] Se actualizează canalele de statistici...');
      for (const [guildId, config] of Object.entries(db.getAll('server_stats') || {})) {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        try {
          if (config.channels.total) {
            const ch = guild.channels.cache.get(config.channels.total);
            if (ch) await ch.setName(`Membri: ${guild.memberCount}`).catch(() => {});
          }
          if (config.channels.bots) {
            const ch = guild.channels.cache.get(config.channels.bots);
            if (ch) await ch.setName(`Boti: ${guild.members.cache.filter(m => m.user.bot).size}`).catch(() => {});
          }
          if (config.channels.online) {
            const ch = guild.channels.cache.get(config.channels.online);
            if (ch) {
              const onlineCount = guild.members.cache.filter(m => m.presence?.status && m.presence.status !== 'offline').size;
              await ch.setName(`Online: ${onlineCount}`).catch(() => {});
            }
          }
        } catch (err) {
          console.error(`[Stats Update Error] Guild: ${guildId}`, err);
        }
      }
    });
  }
};
