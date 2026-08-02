/* by Capitanul burcea,alex */
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} = require('discord.js');
const mm = require('./musicManager');
const radioStations = require('./radioStations');
const { sendLog } = require('./logger');

async function replyHidden(interaction, payload) {
  const data = typeof payload === 'string' ? { content: payload } : payload;
  if (interaction.deferred || interaction.replied) {
    return interaction.followUp({ ...data, flags: MessageFlags.Ephemeral }).catch(() => {});
  }
  return interaction.reply({ ...data, flags: MessageFlags.Ephemeral }).catch(() => {});
}

async function handleMusicPanel(interaction) {
  const id = interaction.customId;
  const guildId = interaction.guild.id;
  const q = mm.getQueueData(guildId);

  const updatePanel = async () => {
    const playerPanel = require('./playerPanel');
    await playerPanel.sendPanel(interaction.channel, guildId);
  };

  try {
    if (id === 'panel_music_play') {
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('panel_music_radio_select')
          .setPlaceholder('Alege un post de radio...')
          .addOptions(Object.entries(radioStations).map(([key, station]) => ({
            label: station.label,
            description: station.description || `Asculta ${station.label} live`,
            value: key,
            emoji: '📻'
          })))
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('panel_music_search')
          .setLabel('Cauta / Library / Spotify')
          .setEmoji('🔍')
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ content: '🎵 Alege ce vrei sa asculti:', components: [row, row2], flags: MessageFlags.Ephemeral });
    }

    if (id === 'panel_music_status') {
      if (!q?.current) return replyHidden(interaction, '⏹️ Momentan nu ruleaza nicio melodie.');

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📻 Status Redare')
        .setDescription(`Acum redam: **[${q.current.title}](${q.current.url})**`)
        .addFields(
          { name: 'Cerut de', value: `${q.current.requester || 'System'}`, inline: true },
          { name: 'Durata', value: `\`${q.current.duration || '--:--'}\``, inline: true },
          { name: 'Volum', value: `\`${q.volume}%\``, inline: true }
        );

      return replyHidden(interaction, { embeds: [embed] });
    }

    if (id === 'panel_music_radio_select') {
      const radioKey = interaction.values[0];
      const station = radioStations[radioKey];
      if (!station) return replyHidden(interaction, '❌ Radio indisponibil.');

      const memberVoice = interaction.member.voice.channel;
      if (!memberVoice) return replyHidden(interaction, '❌ Trebuie sa fii pe un canal de voce!');

      await interaction.deferUpdate();

      const queue = await mm.connect(memberVoice, interaction.channel);
      queue.radio = radioKey;
      queue.queue = [{
        title: `Radio ${station.label}`,
        url: station.urls[0],
        duration: 'LIVE',
        requester: interaction.user.tag,
        author: 'Live Radio',
        radioKey
      }];

      if (queue.current) mm.skip(guildId);
      else await mm.playNext(guildId);

      return updatePanel();
    }

    if (id === 'panel_music_pause') {
      if (!q?.player) return replyHidden(interaction, '❌ Nimic nu ruleaza.');
      const isPaused = q.player.state.status === 'paused';
      if (isPaused) mm.resume(guildId);
      else mm.pause(guildId);
      await interaction.deferUpdate();
      return updatePanel();
    }

    if (id === 'panel_music_skip') {
      if (!q?.player) return replyHidden(interaction, '❌ Nimic nu ruleaza.');
      mm.skip(guildId);
      await interaction.deferUpdate();
      return updatePanel();
    }

    if (id === 'panel_music_stop') {
      if (!q?.connection) return replyHidden(interaction, '❌ Nu ascultam nimic momentan.');
      mm.destroy(guildId);
      await interaction.deferUpdate();
      return updatePanel();
    }

    if (id === 'panel_music_volup' || id === 'panel_music_voldown') {
      const step = id === 'panel_music_volup' ? 10 : -10;
      const v = Math.max(0, Math.min((q?.volume ?? 100) + step, 200));
      mm.setVolume(guildId, v);
      await interaction.deferUpdate();
      return updatePanel();
    }

    if (id === 'panel_music_loop') {
      if (!q) return replyHidden(interaction, '❌ Nimic nu ruleaza.');
      if (!q.looping) q.looping = 'track';
      else if (q.looping === 'track') q.looping = 'queue';
      else q.looping = false;
      await interaction.deferUpdate();
      return updatePanel();
    }

    if (id === 'panel_music_clear') {
      if (!q) return replyHidden(interaction, '❌ Nimic nu ruleaza.');
      q.queue = [];
      q.radio = null;
      await interaction.deferUpdate();
      return updatePanel();
    }

    if (id === 'panel_music_queue') {
      if (!q?.queue?.length) return replyHidden(interaction, '📂 Coada este goala.');

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📜 Coada de redare')
        .setDescription(q.queue.slice(0, 10).map((s, i) => `**${i + 1}.** ${s.title}`).join('\n') + (q.queue.length > 10 ? `\n... si inca ${q.queue.length - 10} melodii.` : ''));

      return replyHidden(interaction, { embeds: [embed] });
    }

    if (id === 'panel_music_rewind') {
      if (!q?.current) return replyHidden(interaction, '❌ Nimic nu ruleaza.');
      q.queue.unshift(q.current);
      mm.skip(guildId);
      await interaction.deferUpdate();
      return updatePanel();
    }

    if (id === 'panel_music_prev') {
      if (!mm.previous(guildId)) return replyHidden(interaction, '⏮️ Nu exista melodie anterioara.');
      await interaction.deferUpdate();
      return updatePanel();
    }

    if (id === 'panel_music_search') {
      const modal = new ModalBuilder()
        .setCustomId('panel_music_search_modal')
        .setTitle('🔍 Cautare Muzica');

      const input = new TextInputBuilder()
        .setCustomId('search_query')
        .setLabel('Nume melodie / URL YouTube/Spotify')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: nume piesa, Spotify sau YouTube')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    if (id === 'panel_music_download') {
      if (!q?.current) return replyHidden(interaction, '❌ Nimic nu ruleaza.');
      if (q.current.duration === 'LIVE') return replyHidden(interaction, '📻 Stream-ul radio live nu poate fi descarcat.');

      const downloadUrl = `https://9xbuddy.com/process?url=${encodeURIComponent(q.current.url)}`;
      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('📥 Descarca Muzica')
        .setDescription(`Melodia curenta:\n\n🎶 **[${q.current.title}](${q.current.url})**`)
        .addFields({ name: 'Link Download', value: `[Click aici pentru Download](${downloadUrl})` });

      return replyHidden(interaction, { embeds: [embed] });
    }
  } catch (err) {
    console.error('[Music Panel Error]', err);
    await sendLog(interaction.guild, 'error', {
      title: 'Eroare Music Panel',
      description: `\`\`\`js\n${String(err.stack || err.message || err).slice(0, 1800)}\n\`\`\``,
      extra: `Custom ID: ${id}\nUser: ${interaction.user.tag} (${interaction.user.id})`
    }).catch(() => {});

    return replyHidden(interaction, '❌ A aparut o eroare la panoul de muzica.');
  }
}

module.exports = { handleMusicPanel };
