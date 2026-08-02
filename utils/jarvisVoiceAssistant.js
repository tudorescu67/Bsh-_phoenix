/* by Capitanul burcea,alex */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');
const prism = require('prism-media');
const ffmpegPath = require('ffmpeg-static');
const {
  AudioPlayerStatus,
  EndBehaviorType,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
} = require('@discordjs/voice');
const { askJarvisMessage } = require('./jarvisClient');

if (ffmpegPath && !process.env.FFMPEG_PATH) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

const sessions = new Map();
const tmpDir = path.resolve(process.env.JARVIS_VOICE_TMP_DIR || path.join(os.tmpdir(), 'bsh-jarvis-vc'));
fs.mkdirSync(tmpDir, { recursive: true });

const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BYTES_PER_SAMPLE = 2;
const silenceMs = Number(process.env.JARVIS_VOICE_SILENCE_MS || 950);
const maxRecordingMs = Number(process.env.JARVIS_VOICE_MAX_RECORDING_MS || 12000);
const minRecordingMs = Number(process.env.JARVIS_VOICE_MIN_RECORDING_MS || 650);
const userCooldownMs = Number(process.env.JARVIS_VOICE_USER_COOLDOWN_MS || 4500);
const maxAudioBytes = SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE * Math.ceil((maxRecordingMs + 1500) / 1000);
const VOICE_EFFECT_PRESETS = {
  clean: '',
  'warm-human': 'highpass=f=75,lowpass=f=13500,bass=g=3:f=115:w=0.6,treble=g=1.5,acompressor=threshold=-18dB:ratio=2.3:attack=12:release=180,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.92',
  radio: 'highpass=f=120,lowpass=f=9500,bass=g=2:f=120:w=0.7,treble=g=3,acompressor=threshold=-20dB:ratio=3.2:attack=8:release=140,loudnorm=I=-15:TP=-1.2:LRA=8,alimiter=limit=0.9',
  club: 'highpass=f=70,lowpass=f=14000,bass=g=6:f=105:w=0.8,treble=g=2.2,aecho=0.55:0.38:55:0.18,acompressor=threshold=-18dB:ratio=2.6:attack=10:release=170,loudnorm=I=-15:TP=-1.4:LRA=9',
  'deep-bass': 'highpass=f=55,lowpass=f=12500,bass=g=8:f=95:w=0.9,treble=g=1,acompressor=threshold=-19dB:ratio=2.8:attack=12:release=190,loudnorm=I=-16:TP=-1.6:LRA=10,alimiter=limit=0.9',
  'space-reverb': 'highpass=f=80,lowpass=f=13000,bass=g=3:f=110:w=0.7,aecho=0.6:0.45:90|180:0.25|0.12,acompressor=threshold=-18dB:ratio=2.2:attack=14:release=220,loudnorm=I=-17:TP=-1.5:LRA=12',
};

function enabled() {
  return process.env.JARVIS_VOICE_ENABLED !== 'false';
}

function splitArgs(value) {
  const args = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = pattern.exec(String(value || '')))) {
    args.push(match[1] ?? match[2] ?? match[3]);
  }
  return args;
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timer = null;
    const done = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };
    const timeoutMs = Number(options.timeout || 0);
    timer = timeoutMs > 0
      ? setTimeout(() => {
        child.kill('SIGTERM');
        done({ code: null, stdout, stderr, err: new Error(`${command} timeout`) });
      }, timeoutMs)
      : null;

    child.stdout?.on('data', data => { stdout += data.toString(); });
    child.stderr?.on('data', data => { stderr += data.toString(); });
    child.on('error', err => done({ code: null, stdout, stderr, err }));
    child.on('close', code => done({ code, stdout, stderr }));
  });
}

function createWavBuffer(pcmBuffer) {
  const byteRate = SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE;
  const blockAlign = CHANNELS * BYTES_PER_SAMPLE;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

function safeFileName(value) {
  return String(value || 'voice').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 90);
}

function cleanup(filePath) {
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {});
}

async function transcribeWithUrl(wavPath) {
  if (!process.env.JARVIS_VOICE_STT_URL) return null;

  const form = new FormData();
  form.append('audio', fs.createReadStream(wavPath), {
    filename: path.basename(wavPath),
    contentType: 'audio/wav',
  });
  form.append('language', process.env.JARVIS_VOICE_LANGUAGE || 'ro');

  const headers = form.getHeaders();
  if (process.env.JARVIS_VOICE_STT_TOKEN) {
    headers.Authorization = `Bearer ${process.env.JARVIS_VOICE_STT_TOKEN}`;
  }

  const { data } = await axios.post(process.env.JARVIS_VOICE_STT_URL, form, {
    headers,
    timeout: Number(process.env.JARVIS_VOICE_STT_TIMEOUT_MS || 45000),
    maxBodyLength: Infinity,
  });

  return String(data?.text || data?.transcript || data?.result?.text || '').trim();
}

async function transcribeWithOpenAI(wavPath) {
  if (!process.env.OPENAI_API_KEY || process.env.JARVIS_VOICE_STT_PROVIDER === 'command') return null;

  const form = new FormData();
  form.append('file', fs.createReadStream(wavPath), {
    filename: path.basename(wavPath),
    contentType: 'audio/wav',
  });
  form.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1');
  form.append('language', process.env.JARVIS_VOICE_LANGUAGE || 'ro');

  const { data } = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    timeout: Number(process.env.JARVIS_VOICE_STT_TIMEOUT_MS || 45000),
    maxBodyLength: Infinity,
  });

  return String(data?.text || '').trim();
}

async function transcribeWithCommand(wavPath) {
  if (!process.env.JARVIS_VOICE_STT_COMMAND) return null;

  const base = wavPath.replace(/\.[^.]+$/, '');
  const args = splitArgs(process.env.JARVIS_VOICE_STT_ARGS || '{file}').map(arg =>
    arg.replaceAll('{file}', wavPath).replaceAll('{base}', base)
  );
  const result = await runProcess(process.env.JARVIS_VOICE_STT_COMMAND, args, {
    timeout: Number(process.env.JARVIS_VOICE_STT_TIMEOUT_MS || 45000),
  });

  if (result.err || result.code !== 0) {
    throw new Error(result.stderr || result.err?.message || 'STT command failed');
  }

  const outputPath = process.env.JARVIS_VOICE_STT_OUTPUT
    ? process.env.JARVIS_VOICE_STT_OUTPUT.replaceAll('{file}', wavPath).replaceAll('{base}', base)
    : null;

  if (outputPath && fs.existsSync(outputPath)) {
    const text = fs.readFileSync(outputPath, 'utf8').trim();
    cleanup(outputPath);
    return text;
  }

  return String(result.stdout || '').trim();
}

async function transcribeAudio(wavPath) {
  const providers = [
    transcribeWithUrl,
    transcribeWithCommand,
    transcribeWithOpenAI,
  ];

  for (const provider of providers) {
    try {
      const text = await provider(wavPath);
      if (text) return text;
    } catch (err) {
      console.warn('[Jarvis VC] STT provider failed:', err.message);
    }
  }

  return '';
}

async function synthesizeWithUrl(text, outputPath) {
  if (!process.env.JARVIS_VOICE_TTS_URL) return null;

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.JARVIS_VOICE_TTS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.JARVIS_VOICE_TTS_TOKEN}`;
  }

  const response = await axios.post(process.env.JARVIS_VOICE_TTS_URL, {
    text,
    voice: process.env.JARVIS_VOICE_TTS_VOICE || 'jarvis-clean-ro',
    voiceProfileId: process.env.JARVIS_VOICE_PROFILE_CONSENT === 'true'
      ? process.env.JARVIS_VOICE_PROFILE_ID
      : undefined,
    style: process.env.JARVIS_VOICE_TTS_STYLE || 'natural, warm, human, radio-ready',
    effectsPreset: process.env.JARVIS_VOICE_EFFECT_PRESET || 'warm-human',
    language: process.env.JARVIS_VOICE_LANGUAGE || 'ro',
    format: 'mp3',
  }, {
    headers,
    responseType: 'arraybuffer',
    timeout: Number(process.env.JARVIS_VOICE_TTS_TIMEOUT_MS || 45000),
  });

  const contentType = response.headers?.['content-type'] || '';
  if (contentType.includes('application/json')) {
    const json = JSON.parse(Buffer.from(response.data).toString('utf8'));
    if (json.path && fs.existsSync(json.path)) return json.path;
    throw new Error(json.error || 'TTS endpoint did not return audio');
  }

  const ext = contentType.includes('wav') ? '.wav' : '.mp3';
  const finalPath = outputPath.replace(/\.[^.]+$/, ext);
  fs.writeFileSync(finalPath, Buffer.from(response.data));
  return finalPath;
}

async function synthesizeWithOpenAI(text, outputPath) {
  if (!process.env.OPENAI_API_KEY || process.env.JARVIS_VOICE_TTS_PROVIDER === 'espeak') return null;

  const response = await axios.post('https://api.openai.com/v1/audio/speech', {
    model: process.env.OPENAI_TTS_MODEL || 'tts-1',
    voice: process.env.OPENAI_TTS_VOICE || 'onyx',
    input: text.slice(0, Number(process.env.JARVIS_VOICE_TTS_MAX_CHARS || 1600)),
    response_format: 'mp3',
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    responseType: 'arraybuffer',
    timeout: Number(process.env.JARVIS_VOICE_TTS_TIMEOUT_MS || 45000),
  });

  const finalPath = outputPath.replace(/\.[^.]+$/, '.mp3');
  fs.writeFileSync(finalPath, Buffer.from(response.data));
  return finalPath;
}

async function synthesizeWithEspeak(text, outputPath) {
  const command = process.env.JARVIS_VOICE_ESPEAK_COMMAND || 'espeak-ng';
  const voice = process.env.JARVIS_VOICE_ESPEAK_VOICE || 'ro';
  const speed = process.env.JARVIS_VOICE_ESPEAK_SPEED || '155';
  const cleanText = text.replace(/\s+/g, ' ').slice(0, Number(process.env.JARVIS_VOICE_TTS_MAX_CHARS || 1200));
  const result = await runProcess(command, ['-v', voice, '-s', speed, '-w', outputPath, cleanText], {
    timeout: Number(process.env.JARVIS_VOICE_TTS_TIMEOUT_MS || 45000),
  });

  if (result.err || result.code !== 0 || !fs.existsSync(outputPath)) {
    throw new Error(result.stderr || result.err?.message || 'espeak-ng unavailable');
  }

  return outputPath;
}

function getVoiceEffectFilter() {
  if (process.env.JARVIS_VOICE_EFFECTS_ENABLED === 'false') return '';
  if (process.env.JARVIS_VOICE_FFMPEG_FILTER) return process.env.JARVIS_VOICE_FFMPEG_FILTER;

  const preset = String(process.env.JARVIS_VOICE_EFFECT_PRESET || 'warm-human').toLowerCase();
  return VOICE_EFFECT_PRESETS[preset] ?? VOICE_EFFECT_PRESETS['warm-human'];
}

async function applyVoiceEffects(inputPath, session) {
  const filter = getVoiceEffectFilter();
  if (!filter || !inputPath || !fs.existsSync(inputPath)) return inputPath;

  const ffmpeg = process.env.FFMPEG_PATH || ffmpegPath || 'ffmpeg';
  const outputPath = path.join(tmpDir, `${safeFileName(session.guildId)}-${Date.now()}-jarvis-fx.wav`);
  const result = await runProcess(ffmpeg, [
    '-y',
    '-hide_banner',
    '-loglevel', 'error',
    '-i', inputPath,
    '-af', filter,
    '-ar', String(SAMPLE_RATE),
    '-ac', String(CHANNELS),
    outputPath,
  ], {
    timeout: Number(process.env.JARVIS_VOICE_EFFECT_TIMEOUT_MS || 30000),
  });

  if (result.err || result.code !== 0 || !fs.existsSync(outputPath)) {
    throw new Error(result.stderr || result.err?.message || 'voice effects failed');
  }

  cleanup(inputPath);
  return outputPath;
}

async function synthesizeSpeech(text, session) {
  const outputPath = path.join(tmpDir, `${safeFileName(session.guildId)}-${Date.now()}-jarvis.wav`);
  const providers = [
    synthesizeWithUrl,
    synthesizeWithOpenAI,
    synthesizeWithEspeak,
  ];

  for (const provider of providers) {
    try {
      const audioPath = await provider(text, outputPath);
      if (audioPath) return await applyVoiceEffects(audioPath, session);
    } catch (err) {
      console.warn('[Jarvis VC] TTS provider failed:', err.message);
    }
  }

  return null;
}

function stripWakeWord(text) {
  const wakeWords = String(process.env.JARVIS_VOICE_WAKE_WORDS || 'jarvis,gervis,bsh')
    .split(',')
    .map(word => word.trim().toLowerCase())
    .filter(Boolean);
  let clean = String(text || '').trim();
  const normalized = clean.toLowerCase();
  const hasWakeWord = wakeWords.some(word => normalized.includes(word));

  if (process.env.JARVIS_VOICE_WAKE_REQUIRED === 'true' && !hasWakeWord) {
    return '';
  }

  for (const word of wakeWords) {
    clean = clean.replace(new RegExp(`\\b${word}\\b[:,]?`, 'ig'), '').trim();
  }

  return clean || text;
}

function recordUserSpeech(session, userId) {
  return new Promise((resolve, reject) => {
    const receiver = session.connection.receiver;
    const opusStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: silenceMs,
      },
    });
    const decoder = new prism.opus.Decoder({
      frameSize: 960,
      channels: CHANNELS,
      rate: SAMPLE_RATE,
    });
    const chunks = [];
    let bytes = 0;
    let finished = false;

    const finish = (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(maxTimer);
      opusStream.destroy();
      decoder.destroy();
      if (err) {
        reject(err);
        return;
      }
      resolve(Buffer.concat(chunks));
    };

    const maxTimer = setTimeout(() => finish(), maxRecordingMs);

    decoder.on('data', chunk => {
      bytes += chunk.length;
      if (bytes <= maxAudioBytes) {
        chunks.push(chunk);
      } else {
        finish();
      }
    });
    decoder.on('error', finish);
    decoder.on('end', () => finish());
    opusStream.on('error', finish);
    opusStream.pipe(decoder);
  });
}

function isTooShort(pcmBuffer) {
  const durationMs = (pcmBuffer.length / (SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE)) * 1000;
  return durationMs < minRecordingMs;
}

async function playAudio(session, audioPath) {
  if (!audioPath || !fs.existsSync(audioPath)) return false;

  session.speaking = true;
  return new Promise((resolve) => {
    const resource = createAudioResource(audioPath, { inlineVolume: true });
    resource.volume?.setVolume(Number(process.env.JARVIS_VOICE_OUTPUT_VOLUME || 0.8));

    const done = () => {
      session.player.off(AudioPlayerStatus.Idle, done);
      session.player.off('error', fail);
      session.speaking = false;
      cleanup(audioPath);
      resolve(true);
    };
    const fail = (err) => {
      console.warn('[Jarvis VC] Playback failed:', err.message);
      done();
    };

    session.player.once(AudioPlayerStatus.Idle, done);
    session.player.once('error', fail);
    session.player.play(resource);
    session.connection.subscribe(session.player);
  });
}

async function handleSpeech(session, userId) {
  if (!enabled() || !session.active || session.speaking) return;
  if (session.recordingUsers.has(userId)) return;

  const now = Date.now();
  if ((session.cooldowns.get(userId) || 0) > now) return;
  session.cooldowns.set(userId, now + userCooldownMs);
  session.recordingUsers.add(userId);

  let wavPath = null;
  try {
    const member = await session.guild.members.fetch(userId).catch(() => null);
    if (!member || member.user.bot) return;

    const pcmBuffer = await recordUserSpeech(session, userId);
    if (!pcmBuffer.length || isTooShort(pcmBuffer)) return;

    wavPath = path.join(tmpDir, `${safeFileName(session.guildId)}-${safeFileName(userId)}-${Date.now()}.wav`);
    fs.writeFileSync(wavPath, createWavBuffer(pcmBuffer));

    const transcript = stripWakeWord(await transcribeAudio(wavPath));
    if (!transcript || transcript.length < 3) return;

    if (process.env.JARVIS_VOICE_TEXT_LOG !== 'false') {
      await session.textChannel?.send(`**${member.user.username}:** ${transcript.slice(0, 500)}`).catch(() => {});
    }

    const result = await askJarvisMessage(transcript, {
      source: 'discord-vc',
      userId,
      username: member.user.tag || member.user.username,
      guildId: session.guildId,
      guildName: session.guild.name,
      channelId: session.voiceChannelId,
      channelName: session.voiceChannelName,
    });
    const answer = String(result?.answer || 'Nu am putut genera un raspuns acum.').trim();

    if (process.env.JARVIS_VOICE_TEXT_LOG !== 'false') {
      await session.textChannel?.send(`**Jarvis:** ${answer.slice(0, 1800)}`).catch(() => {});
    }

    const audioPath = await synthesizeSpeech(answer, session);
    if (audioPath) {
      await playAudio(session, audioPath);
    }
  } catch (err) {
    console.error('[Jarvis VC] Speech loop error:', err);
    await session.textChannel?.send(`Jarvis VC error: ${String(err.message || err).slice(0, 350)}`).catch(() => {});
  } finally {
    cleanup(wavPath);
    session.recordingUsers.delete(userId);
  }
}

async function join(voiceChannel, textChannel, options = {}) {
  if (!enabled()) {
    throw new Error('JARVIS_VOICE_ENABLED=false');
  }

  const existing = sessions.get(voiceChannel.guild.id);
  if (existing) {
    existing.textChannel = textChannel;
    return existing;
  }

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false,
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 20000);

  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Play },
  });
  connection.subscribe(player);

  const session = {
    active: true,
    busy: false,
    client: options.client,
    connection,
    cooldowns: new Map(),
    guild: voiceChannel.guild,
    guildId: voiceChannel.guild.id,
    player,
    recordingUsers: new Set(),
    speaking: false,
    textChannel,
    voiceChannelId: voiceChannel.id,
    voiceChannelName: voiceChannel.name,
  };

  session.onSpeakingStart = (userId) => handleSpeech(session, userId);
  connection.receiver.speaking.on('start', session.onSpeakingStart);
  connection.on(VoiceConnectionStatus.Destroyed, () => {
    sessions.delete(session.guildId);
  });

  sessions.set(session.guildId, session);
  return session;
}

function leave(guildId) {
  const session = sessions.get(guildId);
  if (!session) return false;

  session.active = false;
  session.connection.receiver.speaking.off('start', session.onSpeakingStart);
  session.player.stop(true);
  session.connection.destroy();
  sessions.delete(guildId);
  return true;
}

function getStatus(guildId) {
  const session = sessions.get(guildId);
  if (!session) {
    return {
      active: false,
      effectPreset: process.env.JARVIS_VOICE_EFFECT_PRESET || 'warm-human',
      voiceProfileReady: Boolean(process.env.JARVIS_VOICE_PROFILE_ID && process.env.JARVIS_VOICE_PROFILE_CONSENT === 'true'),
      sttReady: Boolean(process.env.JARVIS_VOICE_STT_URL || process.env.JARVIS_VOICE_STT_COMMAND || process.env.OPENAI_API_KEY),
      ttsReady: Boolean(process.env.JARVIS_VOICE_TTS_URL || process.env.OPENAI_API_KEY || process.env.JARVIS_VOICE_ESPEAK_COMMAND !== 'false'),
    };
  }

  return {
    active: session.active,
    channelId: session.voiceChannelId,
    channelName: session.voiceChannelName,
    effectPreset: process.env.JARVIS_VOICE_EFFECT_PRESET || 'warm-human',
    voiceProfileReady: Boolean(process.env.JARVIS_VOICE_PROFILE_ID && process.env.JARVIS_VOICE_PROFILE_CONSENT === 'true'),
    recordingUsers: session.recordingUsers.size,
    speaking: session.speaking,
    sttReady: Boolean(process.env.JARVIS_VOICE_STT_URL || process.env.JARVIS_VOICE_STT_COMMAND || process.env.OPENAI_API_KEY),
    ttsReady: Boolean(process.env.JARVIS_VOICE_TTS_URL || process.env.OPENAI_API_KEY || process.env.JARVIS_VOICE_ESPEAK_COMMAND !== 'false'),
  };
}

module.exports = {
  getStatus,
  join,
  leave,
};
