/* by Capitanul burcea,alex */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('./database');
const mm = require('./musicManager');
const radioStations = require('./radioStations');

async function sendPanel(channel, guildId) {
  const q = mm.getQueueData(guildId);
  
  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setAuthor({ name: 'Phoenix APP', iconURL: channel.guild.iconURL() })
    .setTitle('Phoenix - Music Panel');

  if (!q?.current) {
    embed.setDescription('Nu se redă nimic acum.')
      .addFields(
        { name: 'Requested By', value: '`-`', inline: true },
        { name: 'Music Duration', value: '`--:--`', inline: true },
        { name: 'Music Author', value: 'Unknown', inline: true },
        { name: 'Status', value: '`Idle`', inline: true },
        { name: 'Volume', value: `\`${q?.volume ?? 100}%\``, inline: true },
        { name: 'Loop', value: '`Off`', inline: true }
      )
      .addFields({ name: 'Up Next', value: 'Coada este goală.' });
  } else {
    const status = q.player?.state?.status === 'paused' ? 'Pauză' : 'Redare';
    const loopStatus = q.looping === 'track' ? 'Melodie' : (q.looping === 'queue' ? 'Coadă' : 'Oprit');
    
    embed.setDescription(`Acum redăm: **[${q.current.title}](${q.current.url})**`)
      .addFields(
        { name: 'Requested By', value: `${q.current.requester}`, inline: true },
        { name: 'Music Duration', value: `\`${q.current.duration}\``, inline: true },
        { name: 'Music Author', value: q.current.author || 'Unknown', inline: true },
        { name: 'Status', value: `\`${status}\``, inline: true },
        { name: 'Volume', value: `\`${q.volume}%\``, inline: true },
        { name: 'Loop', value: `\`${loopStatus}\``, inline: true }
      );

    const upNext = q.queue.length > 0 
      ? q.queue.slice(0, 3).map((s, i) => `${i + 1}. ${s.title}`).join('\n')
      : 'Coada este goală.';
    
    embed.addFields({ name: 'Up Next', value: upNext });
    if (q.current.thumbnail) embed.setThumbnail(q.current.thumbnail);
  }

  embed.setFooter({ text: `Phoenix Risen - Private Community | Coadă: ${q?.queue?.length ?? 0}` });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_music_voldown').setEmoji('🔉').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_music_prev').setEmoji('⏮️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_music_pause').setEmoji('⏸️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('panel_music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_music_volup').setEmoji('🔊').setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_music_rewind').setEmoji('⏪').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_music_queue').setEmoji('📜').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_music_loop').setEmoji('🔁').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('panel_music_clear').setEmoji('🧹').setStyle(ButtonStyle.Secondary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_music_search').setLabel('Search').setEmoji('🔍').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('panel_music_download').setLabel('Download').setEmoji('📥').setStyle(ButtonStyle.Success)
  );

  const row4 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('panel_music_radio_select')
      .setPlaceholder('Schimba pe radio...')
      .addOptions(Object.entries(radioStations).map(([key, station]) => ({
        label: station.label,
        description: station.description || `Asculta ${station.label} live`,
        value: key,
        emoji: '📻'
      })))
  );

  const oldPanelId = db.get('music_panel_id', guildId);
  let message;

  if (oldPanelId) {
    const oldMsg = await channel.messages.fetch(oldPanelId).catch(() => null);
    if (oldMsg) {
      try {
        // Verificăm dacă mesajul este deja ultimul din canal
        const lastMessages = await channel.messages.fetch({ limit: 1 });
        const isLast = lastMessages.first()?.id === oldPanelId;

        if (isLast) {
          // Dacă este ultimul, doar îl edităm pentru a evita spam-ul de delete/send
          message = await oldMsg.edit({ embeds: [embed], components: [row1, row2, row3, row4] });
        } else {
          // Dacă nu este ultimul, îl ștergem și trimitem unul nou pentru a-l aduce jos
          await oldMsg.delete().catch(() => {});
          message = await channel.send({ embeds: [embed], components: [row1, row2, row3, row4] });
        }
      } catch (err) {
        message = await channel.send({ embeds: [embed], components: [row1, row2, row3, row4] });
      }
    } else {
      message = await channel.send({ embeds: [embed], components: [row1, row2, row3, row4] });
    }
  } else {
    message = await channel.send({ embeds: [embed], components: [row1, row2, row3, row4] });
  }

  if (message) db.set('music_panel_id', guildId, message.id);
}

async function deletePanel(guildId, client) {
  const panelId = db.get('music_panel_id', guildId);
  if (!panelId) return;

  const allChannels = client.guilds.cache.get(guildId)?.channels.cache;
  if (!allChannels) return;

  for (const channel of allChannels.values()) {
    if (channel.isTextBased()) {
      try {
        const msg = await channel.messages.fetch(panelId).catch(() => null);
        if (msg) {
          await msg.delete().catch(() => {});
          db.del('music_panel_id', guildId);
          break;
        }
      } catch (err) {}
    }
  }
}

module.exports = { sendPanel, deletePanel };
