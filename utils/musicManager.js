/* by Capitanul burcea,alex */
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, StreamType } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');
const play = require('play-dl');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const radioStations = require('./radioStations');
const { sendLog } = require('./logger');

const queues = new Map();
const STREAM_TIMEOUT_MS = Number(process.env.MUSIC_STREAM_TIMEOUT_MS || 22000);
const RECONNECT_TIMEOUT_MS = Number(process.env.MUSIC_RECONNECT_TIMEOUT_MS || 15000);
const BACKGROUND_CACHE = process.env.MUSIC_BACKGROUND_CACHE !== 'false';
const STABLE_MODE = process.env.MUSIC_STABLE_MODE !== 'false';
const DEFAULT_VOLUME = Math.min(150, Math.max(1, Number(process.env.MUSIC_DEFAULT_VOLUME || 85)));
const MAX_CACHE_BYTES = Math.max(256, Number(process.env.MUSIC_MAX_CACHE_MB || 20480)) * 1024 * 1024;
const DOWNLOAD_DIR = process.env.MUSIC_CACHE_DIR
  ? path.resolve(process.env.MUSIC_CACHE_DIR)
  : path.join(__dirname, '..', 'music_cache');
const MANUAL_LIBRARY_DIR = process.env.MUSIC_LIBRARY_DIR
  ? path.resolve(process.env.MUSIC_LIBRARY_DIR)
  : path.join(DOWNLOAD_DIR, 'manual');
const AUDIO_EXTENSIONS = new Set(['.mp3', '.webm', '.opus', '.ogg', '.m4a', '.wav', '.flac']);
const MOBILE_USER_AGENTS = [
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
];

// Asigurăm existența folderului de download
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(MANUAL_LIBRARY_DIR)) {
  fs.mkdirSync(MANUAL_LIBRARY_DIR, { recursive: true });
}

setInterval(() => {
  try {
    cleanupMusicCache();
  } catch (err) {
    console.warn(`[Music] Cache cleanup periodic failed: ${err.message}`);
  }
}, 30 * 60 * 1000);

function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, {
      connection: null,
      player: null,
      queue: [],
      current: null,
      textChannel: null,
      looping: false,
      volume: DEFAULT_VOLUME,
      radio: null,
      history: [],
      reconnecting: false,
    });
  }
  return queues.get(guildId);
}

function getFileSize(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  } catch {
    return 0;
  }
}

function getFirstExistingPath(paths) {
  return paths.find(p => fs.existsSync(p));
}

function isInside(parent, target) {
  const relative = path.relative(parent, target);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function createStableFileResource(filePath) {
  return createAudioResource(fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 }), {
    inputType: StreamType.Arbitrary,
    inlineVolume: true
  });
}

function getYoutubeVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
    }
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.split('/').filter(Boolean)[0];
    }
  } catch {}

  return url;
}

function getSafeCacheName(value) {
  return String(value || 'song')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80);
}

function getMobileUserAgent() {
  return MOBILE_USER_AGENTS[Math.floor(Math.random() * MOBILE_USER_AGENTS.length)];
}

async function safePlaySearch(query, options, label) {
  try {
    return await play.search(query, options);
  } catch (err) {
    const message = String(err?.message || err || 'unknown error');
    if (message.includes('twoColumnSearchResultsRenderer') || message.includes('Cannot read properties of undefined')) {
      console.warn(`[Music] ${label} a returnat structura invalida (play-dl parser issue). Continui cu fallback.`);
      return [];
    }
    throw err;
  }
}

function getYtDlpSpawnSpec(args = []) {
  const customPath = process.env.YT_DLP_PATH?.trim();
  if (customPath) {
    return { command: customPath, args };
  }

  return { command: 'python3', args: ['-m', 'yt_dlp', ...args] };
}

function spawnYtDlp(args = []) {
  const { command, args: fullArgs } = getYtDlpSpawnSpec(args);
  return spawn(command, fullArgs);
}

function runYtDlpProcess(args = [], timeoutMs = 45000) {
  return new Promise((resolve) => {
    const { command, args: fullArgs } = getYtDlpSpawnSpec(args);
    const child = spawn(command, fullArgs);
    let stderr = '';

    child.stderr.on('data', data => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ code: null, stderr: `${command} timeout` });
    }, timeoutMs);

    child.on('error', err => {
      clearTimeout(timeout);
      resolve({ code: null, stderr, err });
    });

    child.on('close', code => {
      clearTimeout(timeout);
      resolve({ code, stderr });
    });
  });
}

function isYoutubeBotBlock(value) {
  const text = String(value || '').toLowerCase();
  return text.includes('sign in to confirm')
    || text.includes('confirm you are not a bot')
    || text.includes("confirm you're not a bot")
    || text.includes('bot detection');
}

function notifyYoutubeBlocked(q) {
  q?.textChannel?.send('YouTube a blocat cererea. Incearca o alternativa SoundCloud.').catch(() => {});
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scoreSearchMatch(query, title) {
  const q = normalizeSearchText(query);
  const t = normalizeSearchText(title);
  if (!q || !t) return 0;
  if (q === t) return 100;
  if (t.includes(q) || q.includes(t)) return 80;

  const tokens = q.split(' ').filter(token => token.length > 2);
  if (!tokens.length) return 0;
  const hits = tokens.filter(token => t.includes(token)).length;
  return Math.round((hits / tokens.length) * 70);
}

function isReliableSearchMatch(query, title) {
  const threshold = Number(process.env.MUSIC_MATCH_THRESHOLD || 45);
  return scoreSearchMatch(query, title) >= threshold;
}

function collectAudioFiles(dir, depth = 0) {
  if (depth > 2 || !fs.existsSync(dir)) return [];

  const files = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectAudioFiles(fullPath, depth + 1));
      } else if (AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.warn(`[Music] Nu pot citi biblioteca locala (${dir}): ${err.message}`);
  }

  return files;
}

function cleanupMusicCache() {
  if (!MAX_CACHE_BYTES || !fs.existsSync(DOWNLOAD_DIR)) return;

  const files = collectAudioFiles(DOWNLOAD_DIR)
    .filter(filePath => !isInside(MANUAL_LIBRARY_DIR, filePath))
    .map(filePath => {
      try {
        const stat = fs.statSync(filePath);
        return { filePath, size: stat.size, mtimeMs: stat.mtimeMs };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.mtimeMs - b.mtimeMs);

  let total = files.reduce((sum, item) => sum + item.size, 0);
  for (const item of files) {
    if (total <= MAX_CACHE_BYTES) break;
    try {
      fs.unlinkSync(item.filePath);
      total -= item.size;
      console.log(`[Music] Cache vechi sters: ${path.basename(item.filePath)}`);
    } catch (err) {
      console.warn(`[Music] Nu pot sterge cache vechi ${item.filePath}: ${err.message}`);
    }
  }
}

function logFallbackStep(q, song, source, status, reason = '') {
  const title = song?.title || song?.searchQuery || song?.url || 'unknown';
  const message = `[Music][Fallback] source=${source} status=${status} title="${title}"${reason ? ` reason="${reason}"` : ''}`;
  if (status === 'ok') console.log(message);
  else console.warn(message);

  if (q?.textChannel?.guild) {
    sendLog(q.textChannel.guild, 'music', {
      title: 'Music fallback',
      description: message.slice(0, 1800),
      extra: `guild=${q.textChannel.guild.id}`
    }).catch(() => {});
  }
}

function findCachedAudioFileBySong(song) {
  if (!song?.title && !song?.url) return null;

  const videoId = getYoutubeVideoId(song.url);
  const needle = normalizeSearchText(song.title || videoId || '');
  if (!needle) return null;

  const best = collectAudioFiles(DOWNLOAD_DIR)
    .filter(filePath => getFileSize(filePath) >= 5000)
    .map(filePath => {
      const baseName = path.basename(filePath, path.extname(filePath));
      const score = scoreSearchMatch(needle, baseName) + (videoId && baseName.includes(videoId) ? 50 : 0);
      return { filePath, baseName, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (!best || !isReliableSearchMatch(needle, best.baseName)) return null;
  return best.filePath;
}

function findLocalSong(query) {
  const needle = normalizeSearchText(query);
  if (!needle) return null;

  const dirs = [...new Set([MANUAL_LIBRARY_DIR, DOWNLOAD_DIR])];
  let best = null;

  for (const filePath of dirs.flatMap(dir => collectAudioFiles(dir))) {
    const baseName = path.basename(filePath, path.extname(filePath));
    const score = scoreSearchMatch(needle, baseName);
    if (score > (best?.score || 0)) best = { filePath, baseName, score };
  }

  if (!best || !isReliableSearchMatch(needle, best.baseName)) return null;

  return {
    title: best.baseName.replace(/[_-]+/g, ' ').trim(),
    url: `local:${best.baseName}`,
    filePath: best.filePath,
    duration: 'LOCAL',
    requester: 'Local Library',
    source: 'local'
  };
}

function getYoutubePoTokenArg() {
  const poTokenPath = getFirstExistingPath([
    path.join(__dirname, '..', 'data', 'youtube_po_token.txt'),
    path.join(__dirname, '..', 'youtube_po_token.txt')
  ]);
  if (!poTokenPath) return null;

  const poToken = fs.readFileSync(poTokenPath, 'utf8').trim();
  if (!poToken) return null;

  // yt-dlp now expects tokens to identify their client/context, e.g. mweb.gvs+TOKEN.
  if (/^[a-z_]+\.(gvs|player|subs)\+/.test(poToken)) return poToken;
  return `mweb.gvs+${poToken}`;
}

function summarizeYtDlpError(stderr, err) {
  const raw = String(err?.message || stderr || '').replace(/\s+/g, ' ').trim();
  if (!raw) return 'eroare necunoscuta';
  return raw.slice(0, 500);
}

function runDownloadProcess(command, args, timeoutMs = 45000) {
  return new Promise((resolve) => {
    const child = spawn(command, args);
    let stderr = '';

    child.stderr.on('data', data => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ code: null, stderr: `${command} timeout` });
    }, timeoutMs);

    child.on('error', err => {
      clearTimeout(timeout);
      resolve({ code: null, stderr, err });
    });

    child.on('close', code => {
      clearTimeout(timeout);
      resolve({ code, stderr });
    });
  });
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout dupa ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

function getSongSearchQuery(song) {
  return String(song.searchQuery || song.title || '').trim();
}

async function findSoundCloudTrack(query) {
  if (!query) return null;
  const results = await safePlaySearch(query, {
    limit: 5,
    source: { soundcloud: 'tracks' }
  }, 'SoundCloud search');
  return results?.find(track => isReliableSearchMatch(query, track.title || track.name)) || null;
}

async function findYoutubeTrack(query) {
  if (!query) return null;
  const results = await safePlaySearch(query, {
    limit: 5,
    source: { youtube: 'video' }
  }, 'YouTube search');
  return results?.find(track => isReliableSearchMatch(query, track.title || track.name)) || null;
}

async function createPlayDlResourceFromUrl(url) {
  const stream = await play.stream(url, {
    quality: 2,
    discordPlayerCompatibility: true
  });

  return createAudioResource(stream.stream, {
    inputType: stream.type,
    inlineVolume: true
  });
}

async function createFastStreamResource(song, q) {
  const query = getSongSearchQuery(song);
  const attempts = [];

  attempts.push({
    label: 'Local library fallback',
    source: 'local',
    run: async () => {
      const localSong = findLocalSong(query);
      if (!localSong?.filePath) throw new Error('Biblioteca locala nu are o potrivire sigura.');
      song.title = localSong.title;
      song.url = localSong.url;
      song.filePath = localSong.filePath;
      song.source = 'local';
      return createStableFileResource(localSong.filePath);
    }
  });

  attempts.push({
    label: 'SoundCloud search stream',
    source: 'soundcloud',
    run: async () => {
      const track = await findSoundCloudTrack(query);
      if (!track?.url) throw new Error('SoundCloud nu a gasit rezultat redabil.');
      song.resolvedUrl = track.url;
      song.author ||= track.user?.name || track.author?.name || 'SoundCloud';
      song.thumbnail ||= track.thumbnail;
      return createPlayDlResourceFromUrl(track.url);
    }
  });

  if (song.source !== 'spotify' && /^https?:\/\//i.test(song.url || '')) {
    attempts.push({
      label: 'play-dl direct',
      source: 'play-dl',
      run: () => createPlayDlResourceFromUrl(song.url)
    });
  }

  attempts.push({
    label: 'YouTube search stream',
    source: 'youtube',
    run: async () => {
      const track = await findYoutubeTrack(query);
      if (!track?.url) throw new Error('YouTube nu a gasit rezultat redabil.');
      song.resolvedUrl = track.url;
      song.author ||= track.channel?.name || track.author?.name || 'YouTube';
      song.thumbnail ||= track.thumbnails?.[0]?.url || song.thumbnail;
      return createPlayDlResourceFromUrl(track.url);
    }
  });

  attempts.push({
    label: 'yt-dlp direct fallback',
    source: 'yt-dlp',
    run: async () => {
      const videoId = getSafeCacheName(getYoutubeVideoId(song.url || song.resolvedUrl || query));
      const titleKey = getSafeCacheName(song.title || videoId || 'track');
      const outputPath = path.join(DOWNLOAD_DIR, `${titleKey}_${videoId}_fast.webm`);
      const result = await runYtDlpProcess(buildYtDlpArgs(song, outputPath), 60000);
      if (result.code !== 0 || getFileSize(outputPath) < 5000) {
        throw new Error(summarizeYtDlpError(result.stderr, result.err));
      }
      song.filePath = outputPath;
      song.source = 'yt-dlp';
      cleanupMusicCache();
      return createStableFileResource(outputPath);
    }
  });

  attempts.push({
    label: 'Lavalink fallback',
    source: 'lavalink',
    run: async () => {
      if (String(process.env.MUSIC_ENABLE_LAVALINK_FALLBACK || 'false') !== 'true') {
        throw new Error('Lavalink fallback este dezactivat.');
      }
      throw new Error('Lavalink fallback nu este configurat in acest manager.');
    }
  });

  let lastError;
  for (const attempt of attempts) {
    try {
      const resource = await withTimeout(attempt.run(), STREAM_TIMEOUT_MS, attempt.label);
      logFallbackStep(q, song, attempt.source || attempt.label, 'ok');
      console.log(`[Music] Fast stream pregatit prin ${attempt.label}: ${song.title}`);
      return resource;
    } catch (err) {
      lastError = err;
      logFallbackStep(q, song, attempt.source || attempt.label, 'fail', err.message);
      console.warn(`[Music] ${attempt.label} a esuat: ${err.message}`);
    }
  }

  throw lastError || new Error('Nu am gasit stream rapid.');
}

function buildYtDlpArgs(song, outputPath) {
  const args = [
    '-f', 'bestaudio[acodec=opus][ext=webm]/bestaudio[ext=webm]/bestaudio/best',
    '--user-agent', getMobileUserAgent(),
    '--no-playlist',
    '--quiet', '--no-warnings',
    '--force-overwrites',
    '--no-check-certificate',
    '--no-cache-dir',
    '--source-address', '::',
    '--extractor-args', 'youtube:player_client=android,ios,mweb'
  ];

  args.push('-o', outputPath, song.resolvedUrl || song.url);
  return args;
}

function startBackgroundCache(song, outputPath) {
  if (!BACKGROUND_CACHE || song.source === 'spotify' || getFileSize(outputPath) >= 5000) return;

  const args = buildYtDlpArgs(song, outputPath);
  runYtDlpProcess(args, 120000).then(result => {
    if (result.code === 0 && getFileSize(outputPath) >= 5000) {
      console.log(`[Music] Cache background salvat: ${path.basename(outputPath)}.`);
      cleanupMusicCache();
    } else {
      console.warn(`[Music] Cache background esuat: ${summarizeYtDlpError(result.stderr, result.err)}`);
    }
  }).catch(err => console.warn(`[Music] Cache background error: ${err.message}`));
}

async function downloadFromSoundCloudSearch(title, outputPath) {
  if (!title) return { ok: false, error: 'titlu lipsa pentru SoundCloud fallback' };
  const track = await findSoundCloudTrack(title).catch(() => null);
  if (!track?.url) return { ok: false, error: 'SoundCloud nu are o potrivire sigura.' };

  const args = [
    '-f', 'bestaudio/best',
    '--no-playlist',
    '--quiet', '--no-warnings',
    '--force-overwrites',
    '--no-check-certificate',
    '--no-cache-dir',
    '--source-address', '::',
    '--user-agent', getMobileUserAgent(),
    '-o', outputPath,
    track.url
  ];

  const result = await runYtDlpProcess(args, 60000);
  if (result.code === 0 && getFileSize(outputPath) >= 5000) {
    cleanupMusicCache();
    return { ok: true };
  }

  return { ok: false, error: summarizeYtDlpError(result.stderr, result.err) };
}

function isRadioPlaylist(url, headers = {}) {
  const cleanUrl = url.split('?')[0].toLowerCase();
  const contentType = String(headers['content-type'] || '').toLowerCase();

  return cleanUrl.endsWith('.pls')
    || cleanUrl.endsWith('.m3u')
    || cleanUrl.endsWith('.m3u8')
    || contentType.includes('scpls')
    || contentType.includes('mpegurl')
    || contentType.includes('x-mpegurl')
    || contentType.includes('audio/x-scpls');
}

function parseRadioPlaylist(body, baseUrl) {
  const lines = String(body || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const plsMatch = line.match(/^File\d+=(.+)$/i);
    if (plsMatch?.[1]) return new URL(plsMatch[1].trim(), baseUrl).toString();
    if (/^https?:\/\//i.test(line)) return new URL(line, baseUrl).toString();
  }

  return null;
}

function fetchJson(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'PhoenixBot/1.0',
        'Accept': 'application/json'
      },
      timeout: timeoutMs
    }, (res) => {
      if ((res.statusCode || 0) < 200 || (res.statusCode || 0) >= 300) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        body += chunk;
        if (body.length > 512 * 1024) req.destroy(new Error('Raspuns radio API prea mare.'));
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

    req.on('timeout', () => req.destroy(new Error('Timeout radio API.')));
    req.on('error', reject);
  });
}

async function getRadioBrowserFallbackUrls(station) {
  if (!station.search) return [];

  const params = new URLSearchParams({
    hidebroken: 'true',
    order: 'votes',
    reverse: 'true',
    limit: '12'
  });

  for (const [key, value] of Object.entries(station.search)) {
    if (value) params.set(key, value);
  }

  const servers = [
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://at1.api.radio-browser.info'
  ];

  for (const server of servers) {
    try {
      const stations = await fetchJson(`${server}/json/stations/search?${params.toString()}`);
      const urls = [...new Set(stations
        .filter(item => item?.lastcheckok !== 0)
        .map(item => item.url_resolved || item.url)
        .filter(Boolean)
      )];

      if (urls.length > 0) {
        return urls;
      }

      console.warn(`[Music] Radio Browser (${server}) nu a returnat rezultate pentru ${station.label}.`);
    } catch (err) {
      console.warn(`[Music] Radio Browser failed (${server}): ${err.message}`);
    }
  }

  return [];
}

function openRadioStream(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Prea multe redirect-uri radio.'));

    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'PhoenixBot/1.0',
        'Icy-MetaData': '0',
        'Accept': '*/*'
      },
      timeout: 15000
    }, (res) => {
      const status = res.statusCode || 0;
      const location = res.headers.location;

      if (status >= 300 && status < 400 && location) {
        res.resume();
        const nextUrl = new URL(location, url).toString();
        openRadioStream(nextUrl, redirects + 1).then(resolve).catch(reject);
        return;
      }

      if (status < 200 || status >= 300) {
        res.resume();
        reject(new Error(`Radio HTTP ${status}`));
        return;
      }

      if (isRadioPlaylist(url, res.headers)) {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => {
          body += chunk;
          if (body.length > 128 * 1024) req.destroy(new Error('Playlist radio prea mare.'));
        });
        res.on('end', () => {
          const streamUrl = parseRadioPlaylist(body, url);
          if (!streamUrl) {
            reject(new Error('Playlist radio fara stream valid.'));
            return;
          }
          openRadioStream(streamUrl, redirects + 1).then(resolve).catch(reject);
        });
        res.on('error', reject);
        return;
      }

      resolve({ stream: res, url });
    });

    req.on('timeout', () => req.destroy(new Error('Timeout la conectarea radio.')));
    req.on('error', reject);
  });
}

async function createRadioResource(station) {
  let lastError;
  const primaryUrls = Array.isArray(station.urls) ? station.urls : [];
  for (const url of primaryUrls) {
    try {
      const radio = await openRadioStream(url);
      const resource = createAudioResource(radio.stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });
      return { resource, url: radio.url };
    } catch (err) {
      lastError = err;
      console.warn(`[Music] Radio stream failed (${url}): ${err.message}`);
    }
  }

  const fallbackUrls = await getRadioBrowserFallbackUrls(station);
  if (fallbackUrls.length > 0) {
    console.log(`[Music] Radio Browser a gasit ${fallbackUrls.length} fallback-uri pentru ${station.label}.`);
  }

  if (primaryUrls.length === 0 && fallbackUrls.length === 0) {
    lastError = new Error(`Nu exista URL-uri configurate si Radio Browser nu a returnat rezultate pentru ${station.label}.`);
  }

  for (const url of fallbackUrls) {
    try {
      const radio = await openRadioStream(url);
      const resource = createAudioResource(radio.stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });
      return { resource, url: radio.url };
    } catch (err) {
      lastError = err;
      console.warn(`[Music] Radio Browser stream failed (${url}): ${err.message}`);
    }
  }

  throw new Error(`Toate stream-urile pentru ${station.label} au esuat: ${lastError?.message || 'fara URL-uri candidate'}`);
}

async function logMusicError(guildId, title, err, extra = '') {
  const q = queues.get(guildId);
  const guild = q?.textChannel?.guild;
  if (!guild) return;

  await sendLog(guild, 'error', {
    title,
    description: `\`\`\`js\n${String(err?.stack || err?.message || err).slice(0, 1800)}\n\`\`\``,
    extra
  }).catch(() => {});
}

async function connect(voiceChannel, textChannel) {
  const guildId = voiceChannel.guild.id;
  const q = getQueue(guildId);

  if (!q.connection) {
    const conn = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    await entersState(conn, VoiceConnectionStatus.Ready, 20000);

    const player = createAudioPlayer();
    conn.subscribe(player);

    conn.on(VoiceConnectionStatus.Disconnected, async () => {
      if (q.reconnecting) return;
      q.reconnecting = true;
      try {
        await Promise.race([
          entersState(conn, VoiceConnectionStatus.Signalling, RECONNECT_TIMEOUT_MS),
          entersState(conn, VoiceConnectionStatus.Connecting, RECONNECT_TIMEOUT_MS),
        ]);
        q.reconnecting = false;
      } catch (err) {
        const message = String(err?.message || err || '');
        if (message.includes('socket closed') || message.includes('IP discovery')) {
          console.warn(`[Music] Voice socket closed during reconnect in ${guildId}; ignoring recovery attempt.`);
          q.reconnecting = false;
          destroy(guildId);
          return;
        }
        console.warn(`[Music] Voice reconnect failed in ${guildId}: ${message}`);
        q.reconnecting = false;
        destroy(guildId);
      }
    });

    conn.on(VoiceConnectionStatus.Ready, () => {
      q.reconnecting = false;
    });

    player.on(AudioPlayerStatus.Idle, () => playNext(guildId));
    player.on('error', err => {
      console.error('Player Error:', err);
      logMusicError(guildId, 'Eroare Player Muzica', err);
      playNext(guildId);
    });

    q.connection = conn;
    q.player = player;
  }

  q.textChannel = textChannel;
  return q;
}

async function playNext(guildId) {
  const q = queues.get(guildId);
  if (!q) return;

  if (q.queue.length === 0) {
    if (q.looping === 'queue' && q.current) {
      q.queue.push(q.current);
    } else if (q.radio && radioStations[q.radio]) {
      const station = radioStations[q.radio];
      q.queue.push({ title: `Radio ${station.label}`, url: station.urls[0], duration: 'LIVE', requester: 'System', radioKey: q.radio });
    } else {
      q.current = null;
      return;
    }
  }

  let song;
  if (q.looping === 'track' && q.current) {
    song = q.current;
  } else {
    if (q.looping === 'queue' && q.current) {
      q.queue.push(q.current);
    }
    if (q.current && q.current.duration !== 'LIVE') {
      q.history.push(q.current);
      if (q.history.length > 20) q.history.shift();
    }
    song = q.queue.shift();
  }
  
  q.current = song;

  try {
    // Dacă este radio, folosim stream-ul direct (nu are sens să descărcăm un stream live)
    if (song.source === 'local' && song.filePath) {
      if (!fs.existsSync(song.filePath)) throw new Error(`Fisier local lipsa: ${song.filePath}`);
      const resource = createStableFileResource(song.filePath);
      resource.volume?.setVolume(q.volume / 100);
      q.player.play(resource);
    } else if (song.duration === 'LIVE') {
      const station = radioStations[song.radioKey || q.radio];
      if (!station) throw new Error(`Radio necunoscut: ${song.radioKey || q.radio}`);

      const { resource, url } = await createRadioResource(station);
      song.url = url;
      song.title = `Radio ${station.label}`;
      song.author = 'Live Radio';
      song.requester ||= 'System';
      resource.volume?.setVolume(q.volume / 100);
      q.player.play(resource);
    } else {
      // Pentru melodii YouTube normale, folosim descărcarea locală ca buffer
      const videoId = getSafeCacheName(getYoutubeVideoId(song.url));
      const titleKey = getSafeCacheName(song.title || videoId);
      const preferredCachePath = path.join(DOWNLOAD_DIR, `${titleKey}_${videoId}.webm`);
      const legacyCachePath = path.join(DOWNLOAD_DIR, `${videoId}.webm`);
      const existingCachePath = findCachedAudioFileBySong(song);
      const tempFilePath = existingCachePath || (
        getFileSize(preferredCachePath) >= 5000
          ? preferredCachePath
          : (getFileSize(legacyCachePath) >= 5000 ? legacyCachePath : preferredCachePath)
      );
      let resource = null;
      let lastDownloadError = '';
      if (getFileSize(tempFilePath) >= 5000) {
        console.log(`[Music] Folosesc piesa din cache: ${path.basename(tempFilePath)} (${getFileSize(tempFilePath)} bytes).`);
        resource = createStableFileResource(tempFilePath);
      } else if (!STABLE_MODE) {
        console.log(`[Music] Pornesc stream rapid pentru: ${song.title}`);
        try {
          resource = await createFastStreamResource(song, q);
          startBackgroundCache(song, tempFilePath);
        } catch (streamErr) {
          lastDownloadError = streamErr.message;
          console.warn(`[Music] Stream rapid esuat, incerc fallback download: ${streamErr.message}`);
        }
      } else {
        console.log(`[Music] Stable mode activ: descarc in cache inainte de redare pentru ${song.title}.`);
        try {
          resource = await createFastStreamResource(song, q);
          if (song.filePath && getFileSize(song.filePath) >= 5000) {
            startBackgroundCache(song, tempFilePath);
          }
        } catch (stableErr) {
          lastDownloadError = stableErr.message;
          console.warn(`[Music] Stable fast fallback esuat: ${stableErr.message}`);
        }
      }

      console.log(`[Music] Începem descărcarea pentru: ${song.title}`);

      // Metoda 1: Încercăm descărcarea via yt-dlp (cea mai sigură metodă pentru Debian 13)
      if (resource) {
        // Fast stream/cache is already ready.
      } else if (song.source === 'spotify') {
        lastDownloadError = 'Spotify nu ofera audio direct; folosesc fallback SoundCloud.';
      } else if (getFileSize(tempFilePath) < 5000) try {
        console.log(`[Music] Încercăm descărcarea via yt-dlp...`);
        
        const baseArgs = [
          '-f', 'bestaudio[acodec=opus][ext=webm]/bestaudio[ext=webm]/bestaudio/best',
          '--user-agent', getMobileUserAgent(),
          '--no-playlist',
          '--quiet', '--no-warnings',
          '--force-overwrites',
          '--no-check-certificate',
          '--no-cache-dir',
          '--source-address', '::'
        ];

        const ytArgs = 'youtube:player_client=android,ios,mweb';
        const args = [...baseArgs, '--extractor-args', ytArgs];
        console.log('[Music] yt-dlp ruleaza fara cookies, cu IPv6 si client mobil.');

        args.push('--sleep-requests', '1.5', '-o', tempFilePath, song.resolvedUrl || song.url);

        const ytDlpProcess = spawnYtDlp(args);

        let stderr = '';
        ytDlpProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        const ytDlpExitCode = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn(`[Music] yt-dlp dureaza prea mult, incercam fallback...`);
            ytDlpProcess.kill('SIGTERM');
            resolve(null);
          }, 45000);

          ytDlpProcess.on('error', (err) => {
            clearTimeout(timeout);
            console.warn(`[Music] Eroare la pornirea yt-dlp: ${err.message}`);
            resolve(null);
          });

          ytDlpProcess.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
              console.log(`[Music] yt-dlp a terminat descărcarea cu succes.`);
            } else {
              console.warn(`[Music] yt-dlp s-a închis cu codul ${code}. Eroare: ${stderr.slice(0, 200)}...`);
              if (isYoutubeBotBlock(stderr)) {
                console.error('[Music] YouTube a blocat cererea fara cookies. Incerc fallback-ul.');
                notifyYoutubeBlocked(q);
              }
            }
            resolve(code);
          });
        });

        if (ytDlpExitCode === 0 && getFileSize(tempFilePath) >= 1000) {
          console.log(`[Music] Fișier yt-dlp valid: ${getFileSize(tempFilePath)} bytes.`);
          cleanupMusicCache();
        } else {
          lastDownloadError = summarizeYtDlpError(stderr);
        }

      } catch (err) {
        lastDownloadError = err.message;
        console.warn(`[Music] Eroare la spawn yt-dlp: ${err.message}`);
      }

      if (!resource && getFileSize(tempFilePath) < 5000) {
        console.warn('[Music] YouTube nu a mers fara cookies, incerc SoundCloud fallback...');
        const soundCloudResult = await downloadFromSoundCloudSearch(song.title, tempFilePath);
        if (soundCloudResult.ok) {
          console.log(`[Music] SoundCloud fallback a descarcat cu succes: ${getFileSize(tempFilePath)} bytes.`);
        } else {
          lastDownloadError = `yt-dlp: ${lastDownloadError || 'fisier invalid'} | soundcloud: ${soundCloudResult.error}`;
          console.warn(`[Music] SoundCloud fallback a esuat: ${soundCloudResult.error}`);
        }
      }

      // Verificăm dacă yt-dlp a reușit
      if (!resource && getFileSize(tempFilePath) < 5000) {
        console.warn(`[Music] yt-dlp nu a creat un fișier valid, încercăm fallback la play-dl...`);
        
        try {
          // Play-dl stream are nevoie uneori de refresh la token
          const stream = await play.stream(song.url, { 
            quality: 2,
            discordPlayerCompatibility: true
          });
          
          resource = createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true
          });
          
          // Așteptăm buffer-ul de la play-dl
          console.log('[Music] play-dl stream fallback este pregatit.');
        } catch (playDlError) {
          lastDownloadError = `yt-dlp: ${lastDownloadError || 'fisier invalid'} | play-dl: ${playDlError.message}`;
          console.error(`[Music] play-dl a eșuat și el: ${playDlError.message}`);
          if (isYoutubeBotBlock(playDlError.message)) {
             console.error('[Music] YouTube bot detection activa si pe play-dl. Folosim fallback SoundCloud/local library, fara cookies.');
             console.error('[Music] Recomandare VPS: pune piesele importante in MUSIC_LIBRARY_DIR si foloseste linkuri SoundCloud/Bandcamp cand YouTube blocheaza.');
             notifyYoutubeBlocked(q);
          }
        }
      }

      if (!resource && getFileSize(tempFilePath) < 1000) {
        const friendlyError = `Piesa nu poate fi descărcată în acest moment. Este posibil să fie blocată de YouTube sau să nu existe un cache local valid. Încercă altă melodie sau un link SoundCloud/Bandcamp.`;
        q.textChannel?.send(`⚠️ ${friendlyError}`).catch(() => {});
        throw new Error(`Toate metodele de descarcare au esuat. Ultima eroare: ${lastDownloadError || 'necunoscuta'}. Fara cookies, cauza probabila este blocarea IP-ului de catre YouTube sau yt-dlp neactualizat.`);
      }

      if (!resource) {
        resource = createStableFileResource(tempFilePath);
      }
      
      resource.volume.setVolume(q.volume / 100);
      q.player.play(resource);

      // Curățăm fișierul după ce se termină redarea
    }

    // Actualizăm panel-ul automat când începe o piesă nouă
    const playerPanel = require('./playerPanel');
    if (q.textChannel) {
      playerPanel.sendPanel(q.textChannel, guildId).catch(err => console.error('Error sending panel in playNext:', err));
    }
  } catch (err) {
    if (isYoutubeBotBlock(err.message)) {
      console.error('[Music] YouTube block detected even with download attempt.');
      notifyYoutubeBlocked(q);
    }
    console.error(`[Music] Error playing next song in guild ${guildId}:`, err.message);
    await logMusicError(guildId, 'Eroare Redare Muzica', err, `Guild ID: ${guildId}\nMelodie: ${q.current?.title || 'necunoscuta'}`);
    
    // Evităm loop infinit: dacă eroarea persistă, scoatem melodia și trecem la următoarea după o mică pauză
    setTimeout(() => {
      const q = queues.get(guildId);
      if (q && q.queue.length > 0) {
        playNext(guildId);
      } else if (q) {
        q.current = null;
      }
    }, 5000);
  }
}

// === Func?ii noi ===
function setVolume(guildId, volume) {
  const q = queues.get(guildId);
  if (!q) return false;
  q.volume = Math.min(150, Math.max(1, Number(volume) || DEFAULT_VOLUME));
  if (q.player?.state?.resource?.volume) q.player.state.resource.volume.setVolume(q.volume / 100);
  return true;
}

function pause(guildId) {
  const q = queues.get(guildId);
  q?.player?.pause();
  return !!q;
}

function resume(guildId) {
  const q = queues.get(guildId);
  q?.player?.unpause();
  return !!q;
}

function skip(guildId) {
  const q = queues.get(guildId);
  q?.player?.stop();
}

function previous(guildId) {
  const q = queues.get(guildId);
  if (!q || q.history.length === 0) return false;

  const previousSong = q.history.pop();
  if (q.current) q.queue.unshift(q.current);
  q.queue.unshift(previousSong);
  q.player?.stop();
  return true;
}

function destroy(guildId) {
  const q = queues.get(guildId);
  if (!q) return;

  try {
    q.player?.stop();
  } catch {
    // ignore
  }

  try {
    q.connection?.destroy();
  } catch {
    // ignore
  }

  queues.delete(guildId);
}

module.exports = {
  connect, playNext, addSong: (guildId, song) => { getQueue(guildId).queue.push(song); },
  skip, destroy, getQueueData: getQueue,
  findLocalSong,
  setVolume, pause, resume, previous,
  setLoop: (guildId, val) => { const q = getQueue(guildId); q.looping = val; }
};
