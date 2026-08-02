/* by Capitanul burcea,alex */
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/database');
const { sendLog } = require('../utils/logger');
const triggerSystem = require('../utils/triggerSystem');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // === LOGICA LEVELING ===
    const levelKey = `levels_${message.guild.id}_${message.author.id}`;
    let data = db.get('leveling_data', levelKey) || { xp: 0, level: 0 };
    
    // Adaugam XP (intre 15 si 25 per mesaj, cooldown simulat prin sansa)
    if (Math.random() > 0.5) {
      data.xp += Math.floor(Math.random() * 11) + 15;
      
      const nextLevelXP = (data.level + 1) * 500;
      if (data.xp >= nextLevelXP) {
        data.level++;
        message.channel.send(`🎉 Felicitări ${message.author}! Ai ajuns la **Nivelul ${data.level}**! 🚀`).then(m => setTimeout(() => m.delete().catch(() => {}), 10000));
      }
      db.set('leveling_data', levelKey, data);
    }
    // === FINAL LOGICA LEVELING ===

    // === LOGICA AUTOMOD ===
    const member = message.member;
    const isStaff = member.permissions.has(PermissionFlagsBits.ManageMessages);
    
    if (!isStaff) {
      const automodConfig = db.get('automod_config', message.guild.id) || {
        links: false,
        invites: true,
        badWords: ['mue', 'pula', 'fmm', 'jeg', 'cacat'], // Cateva exemple default
        maxMentions: 5
      };

      let violation = null;

      // 1. Invite Links
      if (automodConfig.invites && /(discord\.gg\/|discord\.com\/invite\/)/i.test(message.content)) {
        violation = 'Invite Link';
      }
      // 2. Links general (permitem doar GIF, YT, TikTok)
      else if (automodConfig.links && /https?:\/\/\S+/i.test(message.content)) {
        const allowedLinks = [
          /tenor\.com/i, /giphy\.com/i, /\.gif/i, 
          /youtube\.com/i, /youtu\.be/i, 
          /tiktok\.com/i
        ];
        
        const isAllowed = allowedLinks.some(regex => regex.test(message.content));
        if (!isAllowed) {
          violation = 'Link Nepermis (Doar GIF/YT/TikTok permise)';
        }
      }
      // 3. Bad Words
      else if (automodConfig.badWords.some(word => message.content.toLowerCase().includes(word.toLowerCase()))) {
        violation = 'Cuvânt Interzis';
      }
      // 4. Mention Spam
      else if (message.mentions.users.size > automodConfig.maxMentions) {
        violation = 'Spam Mențiuni';
      }
      // 5. NSFW Content Sensor (Simulat/Discord Built-in Flags)
      else if (message.attachments.size > 0 && !message.channel.nsfw) {
        // Discord marcheaza uneori automat fisierele ca fiind potential NSFW in obiectul attachment
        const hasNSFW = message.attachments.some(a => a.contentType?.includes('image') && (a.description?.toLowerCase().includes('nsfw') || false));
        
        // NOTA: Pentru un senzor real 100% precis e nevoie de un API extern (Sightengine/Google Vision)
        // Aici implementam logica de tracking si sanctiuni ceruta.
        if (hasNSFW) {
          violation = 'Conținut NSFW Detectat';
        }
      }

      if (violation) {
        await message.delete().catch(() => {});
        
        // Sistem de 3 incercari pentru NSFW
        if (violation === 'Conținut NSFW Detectat') {
          const nsfwKey = `nsfw_warns_${message.guild.id}_${message.author.id}`;
          let warns = (db.get('automod_warns', nsfwKey) || 0) + 1;
          
          if (warns >= 3) {
            // Timeout 1 ora la a 3-a abatere
            await member.timeout(3600000, 'Auto-Mod: 3 încercări NSFW detectate').catch(() => {});
            db.set('automod_warns', nsfwKey, 0); // Resetam dupa timeout
            
            await message.channel.send(`🚨 ${message.author} a primit **Timeout (1h)** pentru trimitere repetată de conținut NSFW (3 abateri).`);
          } else {
            db.set('automod_warns', nsfwKey, warns);
            const warnMsg = await message.channel.send(`⚠️ ${message.author}, pozele sunt permise, dar conținutul **NSFW** este interzis! (${warns}/3 abateri)`);
            setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
          }
        } else {
          const warnMsg = await message.channel.send(`⚠️ ${message.author}, mesajul tău a fost șters deoarece conține: **${violation}**.`);
          setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
        }

        await sendLog(message.guild, 'moderation', {
          title: '🛡️ Auto-Mod Action',
          description: `Mesaj șters de la ${message.author}`,
          extra: `Motiv: **${violation}**\nCanal: ${message.channel}\nConținut: \`\`\`${message.content.slice(0, 500)}\`\`\``,
          footer: `User ID: ${message.author.id}`
        });
        return; // Oprim procesarea (fara XP pentru spam/injuraturi)
      }
    }

    await triggerSystem.handleMessage(message).catch((err) => console.error('[Trigger Error]', err));

    // ── XP System ─────────────────────────────────────────
    const userId = message.author.id;
    const guildId = message.guild.id;
    const key = `${guildId}_${userId}`;

    // XP System
    let xpData = db.get('levels', key) || { xp: 0, level: 0, lastMessage: 0 };
    const now = Date.now();
    
    // Cooldown de 1 minut pentru XP (anti-spam)
    if (now - xpData.lastMessage > 60000) {
      const xpToAdd = Math.floor(Math.random() * 10) + 15;
      xpData.xp += xpToAdd;
      xpData.lastMessage = now;

      const nextLevelXP = (xpData.level + 1) * 500;
      if (xpData.xp >= nextLevelXP) {
        xpData.level++;
        xpData.xp = 0; // Resetam XP-ul la inceputul noului nivel sau il lasam sa curga? (Aici il resetam)
        
        // Trimitem mesaj de level up
        const levelEmbed = new EmbedBuilder()
          .setColor(0xfee75c)
          .setTitle('🆙 Level Up!')
          .setDescription(`Felicitări <@${userId}>! Ai ajuns la nivelul **${xpData.level}** pe **phoenixrisen.ro**!`)
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: 'Continuă să fii activ!' });

        message.channel.send({ embeds: [levelEmbed] }).then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 10000);
        });
      }
      db.set('levels', key, xpData);
    }
  }
};
