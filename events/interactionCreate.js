/* by Capitanul burcea,alex */
const { EmbedBuilder } = require('discord.js');
const mm = require('../utils/musicManager');
const { sendLog, recordAction } = require('../utils/logger');
const { handleTicketOpen, handleTicketCloseBtn, handleTicketClaimBtn } = require('../commands/utility/ticket');
const { handleApplyButton, handleApplyModal, handleApplyDecision } = require('../commands/utility/apply');
const { handleSelfRole } = require('../commands/utility/selfroles');
const { handleVerify, handleVerifyModal, completeVerification } = require('../commands/utility/verify');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../utils/database');
const { handleEmbedModal } = require('../commands/utility/embed');
const { handleVCButton } = require('./vcButtonHandler');
const modPanel = require('../commands/moderation/modpanel');

// Handlers pentru noile panouri
const { handleGiveawayButton, handleGiveawayModal } = require('../utils/giveawayHandler');
const { handleMusicPanel } = require('../utils/musicPanelHandler');
const { handleSocialPanel } = require('../utils/socialHandler');
const { handleGamesPanel } = require('../utils/gamesHandler');
const { handleToolsPanel, handleToolsModal } = require('../utils/toolsHandler');
const onboarding = require('../utils/onboardingSystem');

async function safeInteractionReply(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
    return true;
  } catch (err) {
    if (err?.code === 10062 || String(err?.message || '').includes('Unknown interaction')) {
      return false;
    }
    throw err;
  }
}

// ── Muzica ────────────────────────────────────────────────────────────────────
async function handleMusicButton(interaction) {
  const guildId = interaction.guild.id;
  const id = interaction.customId;

  // Defer imediat - evita timeout-ul de 3 secunde
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    if (id === 'vol_up') {
      const q = mm.getQueueData(guildId);
      const v = Math.min((q?.volume ?? 100) + 10, 200);
      mm.setVolume(guildId, v);
      return interaction.editReply({ content: `🔊 Volum: **${v}%**` });
    }
    if (id === 'vol_down') {
      const q = mm.getQueueData(guildId);
      const v = Math.max((q?.volume ?? 100) - 10, 0);
      mm.setVolume(guildId, v);
      return interaction.editReply({ content: `🔉 Volum: **${v}%**` });
    }
    if (id === 'pause') {
      mm.pause(guildId);
      return interaction.editReply({ content: '⏸️ Pauza.' });
    }
    if (id === 'resume') {
      mm.resume(guildId);
      return interaction.editReply({ content: '▶️ Reluat.' });
    }
    if (id === 'skip') {
      mm.skip(guildId);
      return interaction.editReply({ content: '⏭️ Sarit.' });
    }
    if (id.startsWith('radio_')) {
      const type = id.split('_')[1];
      const q = mm.getQueueData(guildId);
      if (q) { q.radio = type; q.queue = []; mm.skip(guildId); }
      return interaction.editReply({ content: `📻 Radio: **${type}**` });
    }
  } catch (err) {
    console.error('[Music Button Error]', err);
    if (interaction.deferred) return interaction.editReply({ content: '❌ Eroare muzica.' });
    return interaction.reply({ content: '❌ Eroare muzica.', flags: MessageFlags.Ephemeral });
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────
module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.guild) return;

    // ── Slash Commands ──────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      const { cooldowns } = client;
      if (!cooldowns.has(command.data.name)) cooldowns.set(command.data.name, new Map());
      const now = Date.now();
      const timestamps = cooldowns.get(command.data.name);
      const cooldownAmount = (command.cooldown ?? 3) * 1000;

      if (timestamps.has(interaction.user.id)) {
        const expiration = timestamps.get(interaction.user.id) + cooldownAmount;
        if (now < expiration) {
          const remaining = ((expiration - now) / 1000).toFixed(1);
          await recordAction(interaction.guild, {
            action: `command.${interaction.commandName}`,
            actor: interaction.user,
            target: interaction.channel?.id,
            status: 'blocked',
            metadata: { reason: 'cooldown', remainingSeconds: remaining },
            discord: false,
          }).catch(() => {});
          return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xff4444).setDescription(`⏳ Mai asteapta **${remaining}s**.`)],
        flags: MessageFlags.Ephemeral,
      });
        }
      }
      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      try {
        await command.execute(interaction, client);
        await recordAction(interaction.guild, {
          action: `command.${interaction.commandName}`,
          actor: interaction.user,
          target: interaction.channel?.id,
          metadata: {
            channelName: interaction.channel?.name,
            commandId: interaction.commandId,
          },
          discord: false,
        });
      } catch (err) {
        console.error(`[Command Error] /${interaction.commandName} in guild ${interaction.guild.name} (${interaction.guild.id}):`, err);
        await recordAction(interaction.guild, {
          action: `command.${interaction.commandName}`,
          actor: interaction.user,
          target: interaction.channel?.id,
          status: 'failed',
          metadata: {
            error: String(err?.message || err).slice(0, 500),
            channelName: interaction.channel?.name,
          },
          discord: false,
        }).catch(() => {});
        
        // Log detaliat către canalul de erori
        await sendLog(interaction.guild, 'error', {
          title: '❌ Eroare Comandă Slash',
          description: `Comanda: \`/${interaction.commandName}\`\nUtilizator: ${interaction.user.tag}\nEroare: \`\`\`js\n${err.stack || err}\n\`\`\``,
          extra: `Canal: ${interaction.channel.name}`
        }).catch(() => {});

        const errMsg = {
          embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('❌ A apărut o eroare la executarea comenzii.')],
          flags: MessageFlags.Ephemeral,
        };
        await safeInteractionReply(interaction, errMsg).catch(() => {});
      }
      return;
    }

    // ── Buttons ─────────────────────────────────────────────
    if (interaction.isButton()) {
      const id = interaction.customId;
      await recordAction(interaction.guild, {
        action: `button.${id}`,
        actor: interaction.user,
        target: interaction.message?.id,
        metadata: { channelId: interaction.channel?.id },
        discord: false,
      }).catch(() => {});

      if (id.startsWith('panel_music_')) return handleMusicPanel(interaction);
      if (id === 'giveaway_enter' || id.startsWith('giveaway_enter_')) return handleGiveawayButton(interaction);
      
      // Apply System
      if (id === 'apply_start') {
        const applyCmd = interaction.client.commands.get('apply');
        if (applyCmd) return applyCmd.handleApplyButton(interaction);
      }
      if (id.startsWith('apply_accept_') || id.startsWith('apply_deny_')) {
        const applyCmd = interaction.client.commands.get('apply');
        if (applyCmd) return applyCmd.handleApplyDecision(interaction);
      }

      // Voice System
      if (id.startsWith('vc_')) {
        const voiceHandler = require('../utils/voiceHandler');
        return voiceHandler.handleInteraction(interaction);
      }

      // --- LOGICA SELF-ROLES ---
      if (id.startsWith('selfrole_')) return handleSelfRole(interaction);

      // --- LOGICA TICKET ---
      if (id === 'ticket_open' || id.startsWith('ticket_open_')) {
        const config = db.get('ticket_config', interaction.guild.id);
        if (!config) return interaction.reply({ content: '❌ Sistemul de ticket nu este configurat!', flags: MessageFlags.Ephemeral });

        const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.username.toLowerCase()}`);
        if (existing) return interaction.reply({ content: `❌ Ai deja un ticket deschis: ${existing}`, flags: MessageFlags.Ephemeral });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: config.categoryId,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: config.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          ],
        });

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('🎫 Ticket Nou')
          .setDescription(`Salut ${interaction.user}! Un membru din echipa staff va prelua cererea ta în scurt timp.\n\nTe rugăm să descrii problema ta cât mai detaliat.`)
          .addFields({ name: '👤 Utilizator', value: `${interaction.user.tag}`, inline: true })
          .setFooter({ text: 'phoenixrisen.ro • Suport' });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Închide').setEmoji('🔒').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ticket_claim').setLabel('Preluat').setEmoji('🙋‍♂️').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('ticket_add_user').setLabel('Adaugă Membru').setEmoji('➕').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('ticket_remove_user').setLabel('Elimină Membru').setEmoji('➖').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setEmoji('📜').setStyle(ButtonStyle.Primary)
        );

        await channel.send({ content: `<@&${config.staffRoleId}> ${interaction.user}`, embeds: [embed], components: [row] });
        return interaction.editReply({ content: `✅ Ticket-ul tău a fost creat: ${channel}` });
      }

      if (id === 'ticket_close' || id === 'ticket_close_btn') {
        const config = db.get('ticket_config', interaction.guild.id);
        const isStaff = interaction.member.roles.cache.has(config?.staffRoleId) || interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
        
        if (!isStaff) {
          return interaction.reply({ content: '❌ Doar staff-ul poate închide ticketele!', flags: MessageFlags.Ephemeral });
        }
        await interaction.reply('🔒 Ticket-ul se va închide în 5 secunde...');
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        
        // Log închiderea
        await sendLog(interaction.guild, 'ticket_close', {
          title: '🎫 Ticket Închis',
          description: `Ticket-ul ${interaction.channel.name} a fost închis de ${interaction.user.tag}`,
          color: 0xff0000
        }).catch(() => {});
        return;
      }

      if (id === 'ticket_claim' || id === 'ticket_claim_btn') {
        const config = db.get('ticket_config', interaction.guild.id);
        if (!interaction.member.roles.cache.has(config?.staffRoleId) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: '❌ Doar staff-ul poate prelua acest ticket!', flags: MessageFlags.Ephemeral });
        }
        
        // Verificăm dacă e deja preluat
        const isClaimed = interaction.message.embeds[0]?.fields?.find(f => f.name === '🙋‍♂️ Preluat de');
        if (isClaimed) return interaction.reply({ content: '❌ Acest ticket este deja preluat!', flags: MessageFlags.Ephemeral });

        await interaction.channel.permissionOverwrites.edit(config.staffRoleId, { ViewChannel: false });
        await interaction.channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
        
        // Actualizăm embed-ul
        const oldEmbed = interaction.message.embeds[0];
        const newEmbed = EmbedBuilder.from(oldEmbed)
          .addFields({ name: '🙋‍♂️ Preluat de', value: `${interaction.user.tag}`, inline: true });
        
        await interaction.message.edit({ embeds: [newEmbed] });
        return interaction.reply({ content: `🙋‍♂️ Ai preluat acest ticket!` });
      }

      if (id === 'ticket_add_user') {
        const config = db.get('ticket_config', interaction.guild.id);
        if (!interaction.member.roles.cache.has(config?.staffRoleId) && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
          return interaction.reply({ content: '❌ Doar staff-ul poate adăuga membri în ticket!', flags: MessageFlags.Ephemeral });
        }
        const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        const modal = new ModalBuilder().setCustomId('ticket_add_modal').setTitle('Adaugă Membru');
        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('user_id').setLabel('ID Membru / Mențiune').setStyle(TextInputStyle.Short).setRequired(true)));
        await interaction.showModal(modal);
      }

      if (id === 'ticket_remove_user') {
        const config = db.get('ticket_config', interaction.guild.id);
        if (!interaction.member.roles.cache.has(config?.staffRoleId) && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
          return interaction.reply({ content: '❌ Doar staff-ul poate elimina membri din ticket!', flags: MessageFlags.Ephemeral });
        }
        const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        const modal = new ModalBuilder().setCustomId('ticket_remove_modal').setTitle('Elimină Membru');
        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('user_id').setLabel('ID Membru / Mențiune').setStyle(TextInputStyle.Short).setRequired(true)));
        await interaction.showModal(modal);
      }

      if (id === 'ticket_transcript') {
        const discordTranscripts = require('discord-html-transcripts');
        const attachment = await discordTranscripts.createTranscript(interaction.channel);
        await interaction.reply({ content: '📜 Transcript-ul a fost generat!', files: [attachment] });
      }
      // --- FINAL LOGICA TICKET ---

      // Butoane noi din Panouri
      if (id.startsWith('panel_giveaway_')) return handleGiveawayButton(interaction);
      if (id.startsWith('panel_social_')) return handleSocialPanel(interaction);
      if (id.startsWith('panel_games_') || id.startsWith('bj_')) return handleGamesPanel(interaction);
      if (id.startsWith('panel_tools_')) return handleToolsPanel(interaction);

      // VC
      if (await handleVCButton(interaction)) return;

      // Tickete
      if (id === 'ticket_close_btn') return handleTicketCloseBtn(interaction);
      if (id === 'ticket_claim_btn') return handleTicketClaimBtn(interaction);

      // Apply
      if (id.startsWith('apply_open_')) return handleApplyButton(interaction);
      if (id.startsWith('apply_accept_') || id.startsWith('apply_deny_') || id.startsWith('apply_pend_'))
        return handleApplyDecision(interaction);


      // Verify
      if (id.startsWith('verify_')) return handleVerify(interaction);

      // Rules Accept
      if (id.startsWith('rules_accept_')) {
        const roleId = id.split('_')[2];
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.reply({ content: '❌ Rolul de membru nu a fost găsit!', flags: MessageFlags.Ephemeral });
        
        await interaction.member.roles.add(role).catch(() => {});
        return interaction.reply({ content: '✅ Ai acceptat regulamentul! Bine ai venit.', flags: MessageFlags.Ephemeral });
      }

      // Mod Panel
      if (id.startsWith('mod_')) return modPanel.handleButton(interaction);
    }

    // ── Select Menus ────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('panel_music_')) return handleMusicPanel(interaction);
      
      // --- LOGICA TICKET SELECT ---
      if (interaction.customId === 'ticket_select') {
        const config = db.get('ticket_config', interaction.guild.id);
        if (!config) return interaction.reply({ content: '❌ Sistemul de ticket nu este configurat!', flags: MessageFlags.Ephemeral });

        const type = interaction.values[0];
        const typeNames = {
          'gen': 'Suport General',
          'report': 'Raport User',
          'vip': 'VIP / Donatie',
          'bug': 'Bug Report',
          'partner': 'Parteneriat'
        };

        const existing = interaction.guild.channels.cache.find(c => c.name.startsWith(type.toLowerCase()) && c.name.endsWith(interaction.user.username.toLowerCase()));
        if (existing) return interaction.reply({ content: `❌ Ai deja un ticket de acest tip deschis: ${existing}`, flags: MessageFlags.Ephemeral });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = await interaction.guild.channels.create({
          name: `${type}-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: config.categoryId,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: config.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          ],
        });

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`🎫 Ticket Nou - ${typeNames[type]}`)
          .setDescription(`Salut ${interaction.user}! Un membru din echipa staff va prelua cererea ta în scurt timp.\n\nTe rugăm să descrii problema ta cât mai detaliat.`)
          .addFields(
            { name: '👤 Utilizator', value: `${interaction.user.tag}`, inline: true },
            { name: '📋 Categorie', value: typeNames[type], inline: true }
          )
          .setFooter({ text: 'phoenixrisen.ro • Suport' });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Închide').setEmoji('🔒').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ticket_claim').setLabel('Preluat').setEmoji('🙋‍♂️').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('ticket_add_user').setLabel('Adaugă Membru').setEmoji('➕').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('ticket_remove_user').setLabel('Elimină Membru').setEmoji('➖').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setEmoji('📜').setStyle(ButtonStyle.Primary)
        );

        await channel.send({ content: `<@&${config.staffRoleId}> ${interaction.user}`, embeds: [embed], components: [row] });
        return interaction.editReply({ content: `✅ Ticket-ul tău a fost creat: ${channel}` });
      }

      if (interaction.customId.startsWith('ticket_open_')) return handleTicketOpen(interaction);
      if (interaction.customId === 'selfrole_select') {
          const selfroleCmd = interaction.client.commands.get('selfroles');
          if (selfroleCmd) return selfroleCmd.handleSelfRole(interaction);
        }
    }

    // ── Modals ──────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const id = interaction.customId;

      if (id.startsWith('onboarding_')) return onboarding.handleModal(interaction);

      if (id === 'mod_modal_target') {
        const userId = interaction.fields.getTextInputValue('mod_input_user').replace(/[<@!>]/g, '');
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return interaction.reply({ content: '❌ Utilizatorul nu a fost găsit!', flags: MessageFlags.Ephemeral });

        // Reutilizăm logica din modpanel.execute, dar trimitem răspunsul aici
        const modCmd = interaction.client.commands.get('modpanel');
        // Creăm un obiect mock pentru a simula opțiunile comenzii
        const fakeInteraction = {
          ...interaction,
          options: {
            getMember: () => target,
            getUser: () => target.user
          },
          reply: (params) => interaction.reply(params)
        };
        return modCmd.execute(fakeInteraction);
      }

      if (id === 'bug_report_modal') {
        const bugCmd = interaction.client.commands.get('bugreport');
        return bugCmd.handleModal(interaction);
      }

      if (id.startsWith('modal_')) return handleToolsModal(interaction);

      if (id.startsWith('panel_music_')) {
        const { handleMusicPanel } = require('../utils/musicPanelHandler');
        
        if (interaction.customId === 'panel_music_search_modal') {
          const query = interaction.fields.getTextInputValue('search_query');
          const mm = require('../utils/musicManager');
          const play = require('play-dl');
          
          await interaction.deferUpdate();
          
          // Verificăm dacă user-ul e pe voce
          const memberVoice = interaction.member.voice.channel;
          if (!memberVoice) return interaction.followUp({ content: '❌ Trebuie să fii pe un canal de voce!', flags: MessageFlags.Ephemeral });

          try {
            let song;
            const localSong = mm.findLocalSong(query);
            if (localSong) {
              song = { ...localSong, requester: interaction.user.tag };
            } else if (play.yt_validate(query) === 'video') {
              song = (await play.video_info(query)).video_details;
            } else {
              let results = [];
              try {
                results = await play.search(query, { limit: 1 });
              } catch (searchErr) {
                console.warn(`[Music] play.search in panel a esuat pentru ${query}: ${searchErr.message}`);
              }

              if (!results.length) {
                if (interaction.deferred || interaction.replied) return interaction.followUp({ content: '❌ Nu am găsit nimic.', flags: MessageFlags.Ephemeral });
                return interaction.reply({ content: '❌ Nu am găsit nimic.', flags: MessageFlags.Ephemeral });
              }
              song = results[0];
            }

            const q = await mm.connect(memberVoice, interaction.channel);
            mm.addSong(interaction.guild.id, song.source === 'local' ? song : {
              title: song.title,
              url: song.url,
              duration: song.durationRaw || 'LIVE',
              thumbnail: song.thumbnails?.[0]?.url,
              requester: interaction.user.tag,
              author: song.channel?.name
            });

            // Trimitem un mesaj de confirmare imediat
            if (interaction.deferred || interaction.replied) {
              await interaction.followUp({ content: `🎵 Adăugat în coadă: **${song.title}**`, flags: MessageFlags.Ephemeral });
            }

            if (!q.current) mm.playNext(interaction.guild.id);
            
            const playerPanel = require('../utils/playerPanel');
            return playerPanel.sendPanel(interaction.channel, interaction.guild.id);
          } catch (err) {
            console.error(err);
            await sendLog(interaction.guild, 'error', {
              title: '❌ Eroare Cautare Muzica',
              description: `Query: \`${query}\`\n\`\`\`js\n${String(err.stack || err.message || err).slice(0, 1700)}\n\`\`\``,
              extra: `User: ${interaction.user.tag} (${interaction.user.id})`
            }).catch(() => {});
            if (interaction.deferred || interaction.replied) return interaction.followUp({ content: '❌ Eroare la căutare.', flags: MessageFlags.Ephemeral });
            return interaction.reply({ content: '❌ Eroare la căutare.', flags: MessageFlags.Ephemeral });
          }
        }
        return handleMusicPanel(interaction);
      }

      // --- LOGICA MODALS ---
      if (interaction.customId === 'ticket_add_modal') {
        const input = interaction.fields.getTextInputValue('user_id');
        const user = interaction.guild.members.cache.get(input.replace(/[<@!>]/g, ''));
        if (!user) return interaction.reply({ content: '❌ Membrul nu a putut fi găsit!', flags: MessageFlags.Ephemeral });
        await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
        return interaction.reply({ content: `✅ Membrul ${user} a fost adăugat în ticket!` });
      }

      if (interaction.customId === 'ticket_remove_modal') {
         const input = interaction.fields.getTextInputValue('user_id');
         const user = interaction.guild.members.cache.get(input.replace(/[<@!>]/g, ''));
         if (!user) return interaction.reply({ content: '❌ Membrul nu a putut fi găsit!', flags: MessageFlags.Ephemeral });
         await interaction.channel.permissionOverwrites.delete(user.id);
         return interaction.reply({ content: `✅ Membrul ${user} a fost eliminat din ticket!` });
       }

       if (interaction.customId === 'apply_modal') {
          const applyCmd = interaction.client.commands.get('apply');
          if (applyCmd) return applyCmd.handleApplyModal(interaction);
        }

        if (interaction.customId.startsWith('vc_modal_')) {
          const voiceHandler = require('../utils/voiceHandler');
          return voiceHandler.handleModal(interaction);
        }

      if (interaction.customId === 'verify_modal') {
        const verifyCmd = interaction.client.commands.get('verify');
        if (verifyCmd) return verifyCmd.handleModalSubmit(interaction);
      }

      if (interaction.customId.startsWith('verify_modal_')) return handleVerifyModal(interaction);
      if (interaction.customId.startsWith('panel_giveaway_modal_')) return handleGiveawayModal(interaction);
      if (interaction.customId.startsWith('apply_modal_')) return handleApplyModal(interaction);
      if (interaction.customId.startsWith('embed_builder_modal')) return handleEmbedModal(interaction);
      if (interaction.customId.startsWith('vc_modal_')) {
        if (await handleVCButton(interaction)) return;
      }
    }

    // ── User Select Menus (VC) ──────────────────────────────
    if (interaction.isUserSelectMenu()) {
      if (interaction.customId.startsWith('vc_select_')) {
        if (await handleVCButton(interaction)) return;
      }
    }
  },
};
