/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const mm = require('../../utils/musicManager');
const play = require('play-dl');
const { sendLog } = require('../../utils/logger');
const https = require('https');

function isSpotifyUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname === 'open.spotify.com' || url.hostname === 'spotify.link';
  } catch {
    return false;
  }
}

function fetchSpotifyOEmbed(spotifyUrl) {
  const endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`;

  return new Promise((resolve, reject) => {
    const req = https.get(endpoint, {
      headers: {
        'User-Agent': 'PhoenixBot/1.0',
        'Accept': 'application/json'
      },
      timeout: 10000
    }, (res) => {
      if ((res.statusCode || 0) < 200 || (res.statusCode || 0) >= 300) {
        res.resume();
        reject(new Error(`Spotify HTTP ${res.statusCode}`));
        return;
      }

      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        body += chunk;
        if (body.length > 256 * 1024) req.destroy(new Error('Raspuns Spotify prea mare.'));
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
      res.on('error', reject);
    });

    req.on('timeout', () => req.destroy(new Error('Timeout Spotify.')));
    req.on('error', reject);
  });
}

function formatSeconds(seconds) {
  const total = Number(seconds || 0);
  if (!Number.isFinite(total) || total <= 0) return 'Spotify';
  const mins = Math.floor(total / 60);
  const secs = Math.floor(total % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function spotifyTrackToSong(track, requester) {
  const artists = Array.isArray(track.artists)
    ? track.artists.map(artist => artist?.name).filter(Boolean).join(', ')
    : '';
  const title = artists ? `${track.name} - ${artists}` : track.name;

  return {
    title,
    searchQuery: title,
    url: track.url || `spotify:${track.id || title}`,
    duration: formatSeconds(track.durationInSec || track.durationInSeconds || track.duration),
    thumbnail: track.thumbnail?.url || track.thumbnail?.[0]?.url,
    requester,
    author: artists || 'Spotify',
    source: 'spotify'
  };
}

async function searchSpotifyTrack(query, requester) {
  const results = await play.search(query, {
    limit: 1,
    source: { spotify: 'track' }
  });
  if (!results?.[0]) return null;
  return spotifyTrackToSong(results[0], requester);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reda o melodie din YouTube, Spotify sau cautare')
    .addStringOption(o => o.setName('melodie').setDescription('Titlu, link YouTube sau link Spotify').setRequired(true)),

  cooldown: 3,

  async execute(interaction) {
    const vc = interaction.member.voice.channel;
    if (!vc) return interaction.reply({ content: '❌ Trebuie să fii în voice!', flags: MessageFlags.Ephemeral });

    await interaction.deferReply();

    const query = interaction.options.getString('melodie');

    try {
      const localSong = mm.findLocalSong(query);
      if (localSong) {
        localSong.requester = interaction.user.tag;

        const q = await mm.connect(vc, interaction.channel);
        mm.addSong(interaction.guild.id, localSong);

        const wasPlaying = !!q.current;
        if (!wasPlaying) await mm.playNext(interaction.guild.id);

        const embed = new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle(wasPlaying ? 'Adaugat din biblioteca' : 'Se reda din biblioteca')
          .setDescription(`**${localSong.title}**`)
          .addFields(
            { name: 'Sursa', value: 'Local cache/library', inline: true },
            { name: 'Cerut de', value: localSong.requester, inline: true }
          );

        return interaction.editReply({ embeds: [embed] });
      }

      if (isSpotifyUrl(query)) {
        const spotify = await fetchSpotifyOEmbed(query);
        const song = {
          title: spotify.title,
          searchQuery: spotify.title,
          url: query,
          duration: 'Spotify',
          thumbnail: spotify.thumbnail_url,
          requester: interaction.user.tag,
          source: 'spotify'
        };

        const q = await mm.connect(vc, interaction.channel);
        mm.addSong(interaction.guild.id, song);

        const wasPlaying = !!q.current;
        if (!wasPlaying) await mm.playNext(interaction.guild.id);

        const embed = new EmbedBuilder()
          .setColor(0x1db954)
          .setTitle(wasPlaying ? 'Adaugat in coada' : 'Se reda acum')
          .setDescription(`**[${song.title}](${song.url})**`)
          .setThumbnail(song.thumbnail)
          .addFields(
            { name: 'Sursa', value: 'Spotify -> SoundCloud/cache', inline: true },
            { name: 'Cerut de', value: song.requester, inline: true }
          );

        return interaction.editReply({ embeds: [embed] });
      }

      // === PLAYLIST ===
      if (play.yt_validate(query) === 'playlist') {
        const playlist = await play.playlist_info(query);
        const videos = playlist.videos || [];

        if (videos.length === 0) {
          return interaction.editReply({ content: '❌ Playlist gol sau inaccesibil.' });
        }

        const songs = videos.slice(0, 30).map(v => ({
          title: v.title,
          url: v.url,
          duration: v.durationRaw || 'LIVE',
          thumbnail: v.thumbnails?.[0]?.url,
          requester: interaction.user.tag,
        }));

        const q = await mm.connect(vc, interaction.channel);
        songs.forEach(song => mm.addSong(interaction.guild.id, song));

        if (!q.current) await mm.playNext(interaction.guild.id);

        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('📋 Playlist adăugat')
            .setDescription(`**${playlist.title}**\n${songs.length} melodii adăugate în coadă`)]
        });
      }

      // === SINGLE SONG / SEARCH ===
      let songInfo;
      if (play.yt_validate(query) === 'video') {
        songInfo = (await play.video_info(query)).video_details;
      } else {
        let results = [];
        try {
          results = await play.search(query, { limit: 1 });
        } catch (searchErr) {
          console.warn(`[Music] play.search a esuat pentru ${query}: ${searchErr.message}`);
        }

        if (!results[0]) {
          const spotifySong = await searchSpotifyTrack(query, interaction.user.tag).catch(() => null);
          if (spotifySong) {
            const q = await mm.connect(vc, interaction.channel);
            mm.addSong(interaction.guild.id, spotifySong);

            const wasPlaying = !!q.current;
            if (!wasPlaying) await mm.playNext(interaction.guild.id);

            const embed = new EmbedBuilder()
              .setColor(0x1db954)
              .setTitle(wasPlaying ? 'Adaugat in coada' : 'Se reda acum')
              .setDescription(`**[${spotifySong.title}](${spotifySong.url})**`)
              .setThumbnail(spotifySong.thumbnail)
              .addFields(
                { name: 'Sursa', value: 'Spotify search -> SoundCloud/YouTube', inline: true },
                { name: 'Cerut de', value: spotifySong.requester, inline: true }
              );

            return interaction.editReply({ embeds: [embed] });
          }
        }
        if (!results[0]) return interaction.editReply({ content: '❌ Nu am găsit rezultate.' });
        songInfo = results[0];
      }

      const song = {
        title: songInfo.title,
        url: songInfo.url,
        duration: songInfo.durationRaw || 'LIVE',
        thumbnail: songInfo.thumbnails?.[0]?.url,
        requester: interaction.user.tag,
      };

      const q = await mm.connect(vc, interaction.channel);
      mm.addSong(interaction.guild.id, song);

      const wasPlaying = !!q.current;
      if (!wasPlaying) await mm.playNext(interaction.guild.id);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(wasPlaying ? '➕ Adăugat în coadă' : '🎵 Se redă acum')
        .setDescription(`**[${song.title}](${song.url})**`)
        .setThumbnail(song.thumbnail)
        .addFields(
          { name: '⏱️ Durata', value: song.duration, inline: true },
          { name: '👤 Cerut de', value: song.requester, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('Play Error:', err);
      await sendLog(interaction.guild, 'error', {
        title: '❌ Eroare /play',
        description: `Query: \`${query}\`\n\`\`\`js\n${String(err.stack || err.message || err).slice(0, 1700)}\n\`\`\``,
        extra: `User: ${interaction.user.tag} (${interaction.user.id})`
      }).catch(() => {});
      await interaction.editReply({ content: `❌ Eroare: ${err.message || 'Ceva nu a mers.'}` }).catch(() => {});
    }
  },
};
