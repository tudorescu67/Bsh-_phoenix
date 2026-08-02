/* by Capitanul burcea,alex */
const { Events, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../utils/database');
const voiceLogger = require('../utils/voiceLogger');
const activityTracker = require('../utils/activityTracker');
const playerPanel = require('../utils/playerPanel');
const mm = require('../utils/musicManager');
const cameraOnly = require('../utils/cameraOnlySystem');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    try {
      const { member, guild } = newState;
      if (!guild || !member) return;
      if (member.user.bot && member.id !== newState.client.user.id) return;

      // --- Bot Music Panel Cleanup ---
      if (member.id === newState.client.user.id) {
        if (oldState.channelId && !newState.channelId) {
          await playerPanel.deletePanel(guild.id, newState.client);
          mm.destroy(guild.id);
        }
        return;
      }

      await cameraOnly.handleVoiceState(oldState, newState).catch((err) => console.error('[CameraOnly Error]', err));

      // --- Voice Logs & Activity ---
      try {
        if (!oldState.channelId && newState.channelId) {
          await voiceLogger.onVoiceJoin(member, newState.channel);
          activityTracker.onJoin(member.id, guild.id);
        } else if (oldState.channelId && !newState.channelId) {
          await voiceLogger.onVoiceLeave(member, oldState.channel);
          activityTracker.onLeave(guild.id, member.id);
        } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
          await voiceLogger.onVoiceMove(member, oldState.channel, newState.channel);
        }
      } catch (logErr) {
        console.error(`[Voice Log Error] ${logErr.message}`);
      }

      const config = db.get('voice_config', guild.id);
    if (!config) {
      // console.log(`[Voice Debug] No config found for guild ${guild.id}`);
      return;
    }

    if (!config.creatorChannelId) {
      console.log(`[Voice Debug] Creator channel ID missing in config for guild ${guild.name}`);
      return;
    }

    // Join to Create
    if (newState.channelId === config.creatorChannelId && oldState.channelId !== newState.channelId) {
      console.log(`[Voice] Detected join on creator channel by ${member.user.tag}`);
        
        try {
          // Verificăm dacă categoria există
          let parentId = config.categoryId;
          if (parentId) {
            const category = guild.channels.cache.get(parentId);
            if (!category || category.type !== ChannelType.GuildCategory) {
              parentId = null; // Fallback la nicio categorie dacă ID-ul e invalid
            }
          }

          const channel = await guild.channels.create({
            name: `🔊 ${member.user.username}`,
            type: ChannelType.GuildVoice,
            parent: parentId,
            permissionOverwrites: [
              { 
                id: member.id, 
                allow: [
                  PermissionFlagsBits.ManageChannels, 
                  PermissionFlagsBits.MoveMembers, 
                  PermissionFlagsBits.MuteMembers, 
                  PermissionFlagsBits.DeafenMembers,
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.Connect
                ] 
              },
              {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
              }
            ],
          });

          await member.voice.setChannel(channel).catch(err => {
            console.error(`[Voice] Failed to move member ${member.user.tag} to temp channel: ${err.message}`);
          });
          
          db.set('temp_vc', channel.id, { ownerId: member.id });

          const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎙️ Control Canal Vocal')
            .setDescription(
              'Folosește butoanele de mai jos pentru a-ți gestiona canalul vocal temporar.\n\n' +
              '▎ **Trebuie sa fii owner-ul canalului** pentru a putea folosi comenzile.\n\n' +
              '🔒 **Blocheaza / 🔓 Deblocheaza**\nOpreste sau permite joinul altor useri\n\n' +
              '✏️ **Redenumeste**\nSchimba numele canalului tau\n\n' +
              '👥 **Limita**\nSeteaza numarul maxim de useri\n\n' +
              '👑 **Transfer**\nDa ownership altui user\n\n' +
              '🚫 **Kick / ✅ Permit**\nGestioneaza accesul userilor\n\n' +
              '👻 **Ascunde / 👁️ Vizibil**\nControleaza vizibilitatea canalului\n\n' +
              '🗑️ **Sterge**\nSterge canalul tau'
            )
            .setFooter({ text: 'Phoenix Risen • VC System' });

          const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vc_lock').setEmoji('🔒').setLabel('Blocheaza').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vc_unlock').setEmoji('🔓').setLabel('Deblocheaza').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vc_rename').setEmoji('✏️').setLabel('Redenumeste').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('vc_limit').setEmoji('👥').setLabel('Limita').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('vc_delete').setEmoji('🗑️').setLabel('Sterge').setStyle(ButtonStyle.Danger)
          );

          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vc_hide').setEmoji('👻').setLabel('Ascunde').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vc_show').setEmoji('👁️').setLabel('Vizibil').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('vc_transfer').setEmoji('👑').setLabel('Transfer Owner').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('vc_kick').setEmoji('🚫').setLabel('Kick User').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('vc_permit').setEmoji('✅').setLabel('Permit User').setStyle(ButtonStyle.Success)
          );

          await channel.send({ content: `${member}`, embeds: [embed], components: [row1, row2] }).catch(() => {});
        } catch (createErr) {
          console.error(`[Voice] Critical error creating temp channel: ${createErr.message}`);
          // Dacă e eroare de permisiuni, logăm clar
          if (createErr.code === 50013) {
            console.error('[Voice] Bot-ul nu are permisiunea "Manage Channels" sau "Move Members"!');
          }
        }
      }

      // Leave to Delete
      if (oldState.channelId && oldState.channelId !== newState.channelId) {
        const tempChannel = db.get('temp_vc', oldState.channelId);
        if (tempChannel) {
          try {
            const channel = oldState.guild.channels.cache.get(oldState.channelId) || await oldState.guild.channels.fetch(oldState.channelId).catch(() => null);
            if (channel && channel.members.size === 0) {
              await channel.delete().catch(() => {});
              db.del('temp_vc', oldState.channelId);
            }
          } catch (delErr) {
            console.error(`[Voice] Error deleting empty temp channel: ${delErr.message}`);
          }
        }
      }
    } catch (globalErr) {
      console.error(`[Voice Global Error] ${globalErr.stack}`);
    }
  },
};
