/* by Capitanul burcea,alex */
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();
const db = require('../utils/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const MUSIC_CACHE_DIR = process.env.MUSIC_CACHE_DIR
  ? path.resolve(process.env.MUSIC_CACHE_DIR)
  : path.join(__dirname, '..', 'music_cache');
const MUSIC_LIBRARY_DIR = process.env.MUSIC_LIBRARY_DIR
  ? path.resolve(process.env.MUSIC_LIBRARY_DIR)
  : path.join(MUSIC_CACHE_DIR, 'manual');
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.opus', '.webm']);
const MAX_UPLOAD_BYTES = Math.max(1, Number(process.env.MUSIC_UPLOAD_MAX_MB || 40)) * 1024 * 1024;
const DASHBOARD_PERMISSIONS_FILE = path.join(DATA_DIR, 'dashboard_permissions.json');
const DASHBOARD_AUDIT_FILE = path.join(DATA_DIR, 'dashboard_audit.json');
const MUSIC_UPLOAD_AUDIT_FILE = path.join(DATA_DIR, 'music_upload_audit.json');
const SELF_ROLES_CONFIG_FILE = 'dashboard_selfroles';

const DASHBOARD_BOTS = [
  {
    profile: 'phoenix',
    displayName: 'Update Phoenix',
    copyright: 'by Capitanul burcea,alex',
    model: 'shared-premium',
    tag: 'main',
    modules: ['muzica', 'jocuri', 'economie', 'ranks', 'moderare', 'setari'],
  },
  {
    profile: 'caisata',
    displayName: 'Caisata Community',
    copyright: 'by Capitanul burcea,alex',
    model: 'shared-premium',
    tag: 'community',
    modules: ['muzica', 'moderare', 'economie', 'tickets'],
  },
  {
    profile: 'bsh',
    displayName: 'BSH Fantasy',
    copyright: 'by Capitanul burcea,alex',
    model: 'shared-premium',
    tag: 'fantasy',
    modules: ['muzica', 'moderare', 'economie', 'tickets'],
  },
  {
    profile: 'bshfantasy',
    displayName: 'BSH Fantasy',
    copyright: 'by Capitanul burcea,alex',
    model: 'shared-premium',
    tag: 'fantasy-alt',
    modules: ['muzica', 'moderare', 'economie', 'tickets'],
  },
  {
    profile: 'staffbsh',
    displayName: 'BSH Community Staff',
    copyright: 'by Capitanul burcea,alex',
    model: 'staff-control',
    tag: 'staff',
    modules: ['moderare', 'setari', 'loguri'],
  },
  {
    profile: 'gamespanel',
    displayName: 'Gamespanel Bot',
    copyright: 'by Capitanul burcea,alex',
    model: 'games-control',
    tag: 'gamespanel',
    modules: ['setari', 'loguri'],
  },
];

const DASHBOARD_SERVERS = [
  {
    id: 'phoenix-main-1',
    name: 'Phoenix Main #1',
    botProfile: 'phoenix',
    botDisplayName: 'Update Phoenix',
    serverRole: 'main',
    label: 'Phoenix Main #1',
    ip: '145.239.10.15',
    port: 25565,
    status: 'online',
    category: 'main',
    location: 'București, România',
    capabilities: ['moderare', 'tickets', 'music', 'audit'],
  },
  {
    id: 'phoenix-main-2',
    name: 'Phoenix Main #2',
    botProfile: 'phoenix',
    botDisplayName: 'Update Phoenix',
    serverRole: 'main',
    label: 'Phoenix Main #2',
    ip: '145.239.10.27',
    port: 25566,
    status: 'online',
    category: 'main',
    location: 'București, România',
    capabilities: ['moderare', 'tickets', 'music'],
  },
  {
    id: 'caisata-community-1',
    name: 'Caisata Community #1',
    botProfile: 'caisata',
    botDisplayName: 'Caisata Community',
    serverRole: 'community',
    label: 'Caisata Community #1',
    ip: '145.239.11.15',
    port: 25615,
    status: 'online',
    category: 'community',
    location: 'Iași, România',
    capabilities: ['tickets', 'moderare', 'news'],
  },
  {
    id: 'bsh-fantasy-1',
    name: 'BSH Fantasy #1',
    botProfile: 'bsh',
    botDisplayName: 'BSH Fantasy',
    serverRole: 'fantasy',
    label: 'BSH Fantasy #1',
    ip: '145.239.12.18',
    port: 25715,
    status: 'standby',
    category: 'fantasy',
    location: 'Cluj-Napoca, România',
    capabilities: ['tickets', 'economy', 'moderare'],
  },
  {
    id: 'staff-dashboard-1',
    name: 'Staff Dashboard #1',
    botProfile: 'staffbsh',
    botDisplayName: 'BSH Community Staff',
    serverRole: 'staff',
    label: 'Staff Dashboard #1',
    ip: '10.0.0.10',
    port: 25815,
    status: 'ready',
    category: 'staff',
    location: 'private network',
    capabilities: ['audit', 'roles', 'tickets'],
  },
];

const DEFAULT_DASHBOARD_PERMISSIONS = {
  updatedAt: new Date().toISOString(),
  modules: [
    { id: 'muzica', name: 'Muzică', roles: ['owner', 'admin', 'moderator'] },
    { id: 'jocuri', name: 'Jocuri', roles: ['owner', 'admin'] },
    { id: 'economie', name: 'Economie', roles: ['owner', 'admin', 'moderator'] },
    { id: 'ranks', name: 'Ranks', roles: ['owner', 'admin'] },
    { id: 'moderare', name: 'Moderare', roles: ['owner', 'admin', 'moderator'] },
    { id: 'setari', name: 'Setări', roles: ['owner', 'admin'] },
  ],
};

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function ensureMusicLibraryDir() {
  fs.mkdirSync(MUSIC_LIBRARY_DIR, { recursive: true });
}

function getSafeBaseName(name) {
  return String(name || 'track')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function getUniqueMusicPath(baseName, ext) {
  const initialPath = path.join(MUSIC_LIBRARY_DIR, `${baseName}${ext}`);
  if (!fs.existsSync(initialPath)) return initialPath;

  let index = 1;
  while (index < 1000) {
    const candidate = path.join(MUSIC_LIBRARY_DIR, `${baseName}_${index}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
    index += 1;
  }

  return path.join(MUSIC_LIBRARY_DIR, `${baseName}_${Date.now()}${ext}`);
}

function getSafeUploader(value) {
  return String(value || 'Unknown')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80) || 'Unknown';
}

function normalizeClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.ip || req.socket?.remoteAddress || 'unknown').replace(/^::ffff:/, '');
}

function appendMusicUploadAudit(entry) {
  const logs = readJson(MUSIC_UPLOAD_AUDIT_FILE, []);
  const payload = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    fileName: entry.fileName,
    sizeBytes: entry.sizeBytes,
    uploadedBy: entry.uploadedBy,
    ip: entry.ip || 'unknown',
    userAgent: entry.userAgent || 'unknown',
    uploadedAt: new Date().toISOString(),
  };

  logs.unshift(payload);
  writeJson(MUSIC_UPLOAD_AUDIT_FILE, logs.slice(0, 2000));
  return payload;
}

function listLibraryTracks() {
  ensureMusicLibraryDir();

  const uploadAudit = readJson(MUSIC_UPLOAD_AUDIT_FILE, []);
  const latestUploaderByFile = new Map();
  for (const row of uploadAudit) {
    if (!row?.fileName || latestUploaderByFile.has(row.fileName)) continue;
    latestUploaderByFile.set(row.fileName, row.uploadedBy || 'Unknown');
  }

  return fs.readdirSync(MUSIC_LIBRARY_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const ext = path.extname(entry.name).toLowerCase();
      if (!AUDIO_EXTENSIONS.has(ext)) return null;

      const fullPath = path.join(MUSIC_LIBRARY_DIR, entry.name);
      const stat = fs.statSync(fullPath);
      return {
        name: entry.name,
        sizeBytes: stat.size,
        uploadedAt: stat.mtime.toISOString(),
        uploadedBy: latestUploaderByFile.get(entry.name) || 'Unknown',
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return structuredClone(fallback);
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallback);
  }
}

function writeJson(filePath, data) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function isPrivateIp(ip) {
  const normalized = String(ip || '').replace(/^::ffff:/, '').trim();

  return (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized.startsWith('10.') ||
    normalized.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized) ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  );
}

function normalizeIp(value) {
  return String(value || 'unknown').split(',')[0].replace(/^::ffff:/, '').trim();
}

async function estimateLocation(ip) {
  if (!ip || ip === 'unknown' || isPrivateIp(ip)) {
    return {
      label: 'Local / private network',
      country: 'local',
      city: 'private',
      estimated: false,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,query`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Geo lookup failed with ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error('Geo lookup returned non-success status');
    }

    const parts = [data.city, data.regionName, data.country].filter(Boolean);

    return {
      label: parts.join(', ') || 'Unknown location',
      country: data.country || 'unknown',
      city: data.city || 'unknown',
      estimated: true,
    };
  } catch {
    return {
      label: 'Unknown location',
      country: 'unknown',
      city: 'unknown',
      estimated: false,
    };
  }
}

function buildAuditEntry({ socket, action, actor }) {
  const ip = normalizeIp(
    socket.handshake.headers['x-forwarded-for'] ||
    socket.handshake.address ||
    socket.conn?.remoteAddress ||
    'unknown'
  );

  return estimateLocation(ip).then((location) => ({
    id: `${Date.now()}-${socket.id}`,
    action,
    actor: actor || socket.handshake.auth?.user || 'Phoenix dashboard user',
    ip,
    location,
    socketId: socket.id,
    userAgent: socket.handshake.headers['user-agent'] || 'unknown',
    createdAt: new Date().toISOString(),
  }));
}

let dashboardPermissions = readJson(DASHBOARD_PERMISSIONS_FILE, DEFAULT_DASHBOARD_PERMISSIONS);
let dashboardAuditLogs = readJson(DASHBOARD_AUDIT_FILE, []);

function saveDashboardAuditLogs() {
  writeJson(DASHBOARD_AUDIT_FILE, dashboardAuditLogs);
}

function saveDashboardPermissions() {
  writeJson(DASHBOARD_PERMISSIONS_FILE, dashboardPermissions);
}

function pushAuditLog(entry) {
  dashboardAuditLogs = [entry, ...dashboardAuditLogs].slice(0, 250);
  saveDashboardAuditLogs();
  io.emit('dashboard:audit-log', entry);
}

function recordAudit(socket, payload = {}) {
  return buildAuditEntry({
    socket,
    action: String(payload.action || 'dashboard_action'),
    actor: payload.actor || socket.handshake.auth?.user || 'Phoenix dashboard user',
  }).then((entry) => {
    const enriched = {
      ...entry,
      category: payload.category || 'general',
      botProfile: payload.botProfile || 'phoenix',
      server: payload.server || 'main',
      target: payload.target || '',
      details: payload.details || '',
    };

    pushAuditLog(enriched);
    return enriched;
  });
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

ensureMusicLibraryDir();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/dashboard/permissions', (req, res) => {
  res.json(dashboardPermissions);
});

app.get('/api/dashboard/bots', (req, res) => {
  res.json(DASHBOARD_BOTS);
});

app.get('/api/dashboard/servers', (req, res) => {
  res.json(DASHBOARD_SERVERS);
});

app.get('/api/dashboard/selfroles', (req, res) => {
  const serverId = String(req.query.serverId || '').trim();
  const dashboardConfigs = db.getAll(SELF_ROLES_CONFIG_FILE) || {};
  const botConfigs = db.getAll('selfroles_config') || {};

  const normalizeBotConfig = (config, id) => {
    if (!config) return null;
    const firstRole = Array.isArray(config.roles) ? config.roles[0] : null;

    return {
      serverId: id,
      roleId: firstRole?.value || '',
      channelId: config.channelId || '',
      title: config.title || '',
      description: config.description || '',
      roles: Array.isArray(config.roles) ? config.roles : [],
      updatedAt: config.updatedAt || null,
      updatedBy: config.updatedBy || 'bot-command',
      source: 'bot-command',
    };
  };

  if (serverId) {
    return res.json({
      serverId,
      config: dashboardConfigs[serverId] || normalizeBotConfig(botConfigs[serverId], serverId),
    });
  }

  res.json({
    configs: dashboardConfigs,
    botConfigs: Object.fromEntries(
      Object.entries(botConfigs).map(([id, config]) => [id, normalizeBotConfig(config, id)])
    ),
  });
});

app.put('/api/dashboard/selfroles', (req, res) => {
  const serverId = String(req.body?.serverId || '').trim();
  const roleId = String(req.body?.roleId || '').trim();
  const channelId = String(req.body?.channelId || '').trim();

  if (!serverId) return res.status(400).json({ message: 'serverId is required' });
  if (!roleId) return res.status(400).json({ message: 'roleId is required' });
  if (!channelId) return res.status(400).json({ message: 'channelId is required' });

  const isSnowflake = (value) => /^\d{17,20}$/.test(value);
  if (!isSnowflake(roleId) || !isSnowflake(channelId)) {
    return res.status(400).json({ message: 'roleId and channelId must be valid Discord snowflakes' });
  }

  const configs = db.getAll(SELF_ROLES_CONFIG_FILE) || {};
  const updated = {
    serverId,
    roleId,
    channelId,
    updatedAt: new Date().toISOString(),
    updatedBy: String(req.body?.updatedBy || 'dashboard-user').trim() || 'dashboard-user',
  };

  configs[serverId] = updated;
  db.save(SELF_ROLES_CONFIG_FILE, configs);

  pushAuditLog({
    action: 'selfroles.update',
    actor: updated.updatedBy,
    category: 'selfroles',
    botProfile: 'phoenix',
    server: serverId,
    target: `${roleId} -> ${channelId}`,
    details: 'Updated self-roles configuration from dashboard',
    ip: normalizeClientIp(req),
    location: { label: 'dashboard', country: 'local', city: 'local', estimated: false },
    socketId: 'dashboard',
    userAgent: req.headers['user-agent'],
    createdAt: updated.updatedAt,
  });

  res.json({ config: updated });
});

app.put('/api/dashboard/permissions', (req, res) => {
  const { modules } = req.body || {};

  if (!Array.isArray(modules)) {
    return res.status(400).json({ message: 'modules must be an array' });
  }

  dashboardPermissions = {
    updatedAt: new Date().toISOString(),
    modules: modules
      .map((module) => ({
        id: String(module.id || '').trim(),
        name: String(module.name || module.id || '').trim(),
        roles: Array.isArray(module.roles) ? module.roles.map((role) => String(role).trim()).filter(Boolean) : [],
      }))
      .filter((module) => module.id),
  };

  saveDashboardPermissions();
  res.json(dashboardPermissions);
});

app.get('/api/dashboard/logs', (req, res) => {
  res.json(dashboardAuditLogs);
});

app.get('/api/music/library', (req, res) => {
  try {
    res.json({ tracks: listLibraryTracks() });
  } catch (error) {
    res.status(500).json({ message: 'Nu am putut citi libraria audio.' });
  }
});

app.get('/api/music/library/:trackName/stream', (req, res) => {
  try {
    ensureMusicLibraryDir();

    const decodedName = decodeURIComponent(req.params.trackName || '');
    const safeName = path.basename(decodedName);
    const extension = path.extname(safeName).toLowerCase();
    if (!safeName || !AUDIO_EXTENSIONS.has(extension)) {
      return res.status(400).json({ message: 'Fisier audio invalid.' });
    }

    const targetPath = path.join(MUSIC_LIBRARY_DIR, safeName);
    if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
      return res.status(404).json({ message: 'Fisierul nu exista in librarie.' });
    }

    return res.sendFile(targetPath);
  } catch {
    return res.status(500).json({ message: 'Nu am putut reda fisierul audio.' });
  }
});

app.post('/api/music/upload', (req, res) => {
  upload.single('musicFile')(req, res, (uploadError) => {
    if (uploadError?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        message: `Fisierul este prea mare. Maxim ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`,
      });
    }

    if (uploadError) {
      return res.status(400).json({ message: 'Nu am putut procesa fisierul trimis.' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nu ai trimis niciun fisier.' });
      }

      const extension = path.extname(req.file.originalname || '').toLowerCase();
      if (!AUDIO_EXTENSIONS.has(extension)) {
        return res.status(400).json({
          message: `Format audio invalid. Permise: ${Array.from(AUDIO_EXTENSIONS).join(', ')}`,
        });
      }

      const originalBase = path.basename(req.file.originalname, extension);
      const safeBase = getSafeBaseName(originalBase) || 'track';
      const targetPath = getUniqueMusicPath(safeBase, extension);

      fs.writeFileSync(targetPath, req.file.buffer);

      const fileName = path.basename(targetPath);
      const stat = fs.statSync(targetPath);
      const uploadedBy = getSafeUploader(req.body?.uploadedBy);

      appendMusicUploadAudit({
        fileName,
        sizeBytes: stat.size,
        uploadedBy,
        ip: normalizeClientIp(req),
        userAgent: req.headers['user-agent'],
      });

      return res.status(201).json({
        message: 'Fisierul a fost incarcat in biblioteca.',
        track: {
          name: fileName,
          sizeBytes: stat.size,
          uploadedAt: stat.mtime.toISOString(),
          uploadedBy,
        },
      });
    } catch {
      return res.status(500).json({ message: 'Upload esuat. Incearca din nou.' });
    }
  });
});

app.post('/api/dashboard/logs', (req, res) => {
  const payload = req.body || {};

  if (!payload.action) {
    return res.status(400).json({ message: 'action is required' });
  }

  const manualEntry = {
    id: `${Date.now()}-manual`,
    action: String(payload.action),
    actor: String(payload.actor || 'Phoenix dashboard user'),
    category: String(payload.category || 'general'),
    botProfile: String(payload.botProfile || 'phoenix'),
    server: String(payload.server || 'main'),
    target: String(payload.target || ''),
    details: String(payload.details || ''),
    ip: String(payload.ip || 'dashboard'),
    location: payload.location || { label: 'manual entry', country: 'local', city: 'local', estimated: false },
    socketId: String(payload.socketId || 'manual'),
    userAgent: String(payload.userAgent || 'dashboard-ui'),
    createdAt: new Date().toISOString(),
  };

  pushAuditLog(manualEntry);
  res.status(201).json(manualEntry);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  buildAuditEntry({ socket, action: 'dashboard_connect' })
    .then((entry) => pushAuditLog(entry))
    .catch((error) => console.warn('Failed to write dashboard audit log:', error));

  socket.on('dashboard:identify', async (payload = {}) => {
    try {
      await recordAudit(socket, {
        action: 'dashboard_identify',
        actor: payload.user || payload.name || 'Phoenix dashboard user',
        category: 'connect',
        botProfile: payload.botProfile || 'phoenix',
        server: payload.server || 'main',
        target: payload.module || 'dashboard',
        details: 'dashboard identify',
      });
    } catch (error) {
      console.warn('Failed to record identify event:', error);
    }
  });

  socket.on('dashboard:action', async (payload = {}) => {
    try {
      await recordAudit(socket, {
        action: payload.action || 'dashboard_action',
        actor: payload.actor || payload.user || 'Phoenix dashboard user',
        category: payload.category || 'general',
        botProfile: payload.botProfile || 'phoenix',
        server: payload.server || 'main',
        target: payload.target || '',
        details: payload.details || '',
      });
    } catch (error) {
      console.warn('Failed to record dashboard action:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
