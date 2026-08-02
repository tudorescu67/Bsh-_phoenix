const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;
const ROOT = __dirname;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://127.0.0.1:3001/auth/discord/callback';
const ALLOWED_DISCORD_IDS = (process.env.ALLOWED_DISCORD_IDS || '').split(',').map(item => item.trim()).filter(Boolean);

const initialState = {
  overview: {
    modules: ['Moderare', 'Welcomer', 'Music', 'Tickets', 'Anti-Raid', 'Selfroles', 'Verification', 'Automations', 'Webhooks', 'Economy', 'Reaction Roles', 'Backup'],
    stats: {
      members: '12.8k',
      tickets: 19,
      giveaways: 3,
      security: '97%'
    }
  },
  giveaways: [
    { prize: 'Discord Nitro (1 lună)', channel: '#giveaway-uri', entries: 284, status: 'activ', ends: 'în 6 ore' },
    { prize: 'Rol custom + 500 coins', channel: '#evenimente', entries: 97, status: 'activ', ends: 'în 1 zi' },
    { prize: 'Steam Key', channel: '#giveaway-uri', entries: 412, status: 'încheiat', ends: 'acum 2 h' }
  ],
  tickets: [
    { id: '#0512', subject: 'Nu pot accesa canalul de trading', user: '@denis77', status: 'open' },
    { id: '#0511', subject: 'Raport: spam în #chat-general', user: '@ioana.m', status: 'pending' },
    { id: '#0509', subject: 'Problemă cu rolul de booster', user: '@alexNS', status: 'open' }
  ],
  staff: [
    { user: '@robert.k', role: 'Moderator', note: 'Experiență bună, disponibil zilnic', status: 'pending' },
    { user: '@luna_dev', role: 'Helper', note: 'Cunoaște regulamentul și comunitatea', status: 'pending' },
    { user: '@mihai_gg', role: 'Moderator', note: 'Recomandat de echipa actuală', status: 'accepted' }
  ],
  leaderboard: [
    { rank: 1, user: '@cosmin_', level: 42, xp: '98.4k' },
    { rank: 2, user: '@denis77', level: 39, xp: '91.2k' },
    { rank: 3, user: '@ioana.m', level: 35, xp: '80.1k' }
  ],
  moderation: [
    { action: 'Ban', user: '@xStorm', mod: 'Andrei', reason: 'Spam repetat', time: 'acum 3h' },
    { action: 'Mute', user: '@fake_acc22', mod: 'Maria', reason: 'Limbaj toxic', time: 'acum 5h' }
  ],
  raids: [
    { type: 'red', text: 'Raid blocat: 14 conturi noi în 8 secunde', time: 'acum 4 zile' },
    { type: 'amber', text: 'Cont suspect @xh_9204 kick-uit automat', time: 'acum 4 zile' }
  ],
  welcome: [
    { name: 'Welcome mesaj', desc: 'Trimite mesaj la intrare', on: true },
    { name: 'Goodbye mesaj', desc: 'Trimite mesaj la ieșire', on: true },
    { name: 'Rol automat', desc: 'Oferă rol nou-veniților', on: false }
  ],
  selfroles: [
    { name: 'Notificări jocuri', roles: 'Valorant, Minecraft, GTA RP', mode: 'Dropdown' },
    { name: 'Pronume', roles: 'El/Lui, Ea/Ei', mode: 'Buton' }
  ],
  logs: [
    { type: 'green', text: '@denis77 a intrat pe server', time: 'acum 2 min' },
    { type: 'amber', text: 'Comanda !ban folosită de Andrei', time: 'acum 3 h' },
    { type: 'violet', text: 'Giveaway „Steam Key” a primit 412 participări', time: 'acum 5 h' }
  ],
  music: [
    { name: 'Canal music', value: '#muzica' },
    { name: 'Rol DJ', value: 'DJ' },
    { name: 'Volum implicit', value: '68%' },
    { name: 'Loop', value: 'off' }
  ],
  economy: [
    { name: 'Daily reward', value: '25 coins' },
    { name: 'Economy channel', value: '#economy' },
    { name: 'Shop status', value: 'activ' },
    { name: 'Leaderboards', value: 'live' }
  ],
  autorole: [
    { name: 'Rol nou-venit', value: 'Member' },
    { name: 'Rol verificare', value: 'Verified' },
    { name: 'Rol pe nivel', value: 'Level 10' }
  ],
  reactionroles: [
    { name: 'Jocuri', value: 'Valorant / Minecraft / GTA RP' },
    { name: 'Pronume', value: 'El / Ea / Neutru' },
    { name: 'Culoare', value: 'Roșu / Albastru / Verde' }
  ],
  voice: [
    { name: 'Canale temporare', value: 'activ' },
    { name: 'Limit membri', value: '8 per canal' },
    { name: 'Categorie', value: 'Voice Hub' },
    { name: 'Auto-join', value: 'on' }
  ],
  backup: [
    { name: 'Backup 08/02', value: 'config + roluri' },
    { name: 'Backup 07/02', value: 'module și reguli' },
    { name: 'Backup 06/02', value: 'loguri și setări' }
  ],
  verification: [
    { name: 'Captcha', value: 'activ la intrare' },
    { name: 'Rol verificare', value: 'Verified' },
    { name: 'Verificare email', value: 'opțional' }
  ],
  automations: [
    { name: 'Auto-mute', value: 'după 3 warn-uri' },
    { name: 'Auto-delete spam', value: 'în canalul #chat' },
    { name: 'Auto-rol la apel', value: 'activ' }
  ],
  webhooks: [
    { name: 'Logging', value: 'webhook #audit' },
    { name: 'Alerts', value: 'webhook #alerts' },
    { name: 'External sync', value: 'Zapier / n8n' }
  ],
  status: {
    botOnline: true,
    lastSync: new Date().toISOString()
  }
};

let state = JSON.parse(JSON.stringify(initialState));
const pendingStates = new Map();
const sessions = new Map();

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*'
  });
  res.end(text);
}

function readJsonBody(req, callback) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      callback(body ? JSON.parse(body) : {});
    } catch (error) {
      callback(null);
    }
  });
}

function getSessionFromRequest(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/phoenix_session=([^;]+)/);
  if (!match) return null;
  return sessions.get(match[1]) || null;
}

function setSessionCookie(res, sessionId) {
  res.setHeader('Set-Cookie', `phoenix_session=${sessionId}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'phoenix_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
}

function isDiscordConfigured() {
  return Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET);
}

function createSessionForUser(userInfo) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  sessions.set(sessionId, {
    userId: userInfo.userId || userInfo.id || 'local-dev',
    username: userInfo.username || 'phoenix',
    avatar: userInfo.avatar || null,
    email: userInfo.email || null,
    createdAt: Date.now()
  });
  return sessionId;
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(html);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location, 'Access-Control-Allow-Origin': '*' });
  res.end();
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    data: text ? JSON.parse(text) : {}
  };
}

async function handleDiscordCallback(code, state) {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    throw new Error('Discord OAuth is not configured.');
  }
  const pending = pendingStates.get(state);
  if (!pending) throw new Error('Invalid state');
  pendingStates.delete(state);

  const params = new URLSearchParams();
  params.set('client_id', DISCORD_CLIENT_ID);
  params.set('client_secret', DISCORD_CLIENT_SECRET);
  params.set('grant_type', 'authorization_code');
  params.set('code', code);
  params.set('redirect_uri', DISCORD_REDIRECT_URI);

  const tokenResponse = await fetchJson('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange Discord code');
  }

  const userResponse = await fetchJson('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${tokenResponse.data.access_token}`
    }
  });

  if (!userResponse.ok) throw new Error('Failed to fetch Discord user');

  const user = userResponse.data;
  if (ALLOWED_DISCORD_IDS.length && !ALLOWED_DISCORD_IDS.includes(user.id)) {
    throw new Error('User is not authorized for this dashboard');
  }

  const sessionId = crypto.randomBytes(16).toString('hex');
  sessions.set(sessionId, {
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    email: user.email || null,
    createdAt: Date.now()
  });
  return { user, sessionId };
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml'
  }[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, 404, 'Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');

  if (req.method === 'OPTIONS') {
    sendText(res, 204, '');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, uptime: process.uptime() });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/me') {
    const session = getSessionFromRequest(req);
    if (!session) {
      sendJson(res, 401, { ok: false, message: 'Unauthorized' });
      return;
    }
    sendJson(res, 200, { ok: true, user: session });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/logout') {
    const sessionCookie = req.headers.cookie || '';
    const match = sessionCookie.match(/phoenix_session=([^;]+)/);
    if (match) sessions.delete(match[1]);
    clearSessionCookie(res);
    redirect(res, '/auth.html');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/auth/discord') {
    if (!isDiscordConfigured()) {
      const demoSessionId = createSessionForUser({ id: 'local-dev', username: 'phoenix' });
      setSessionCookie(res, demoSessionId);
      redirect(res, '/nexus-console.html');
      return;
    }
    const state = crypto.randomBytes(16).toString('hex');
    pendingStates.set(state, { createdAt: Date.now() });
    const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent(DISCORD_CLIENT_ID)}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent('identify email')}&state=${encodeURIComponent(state)}`;
    redirect(res, authorizeUrl);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/auth/discord/callback') {
    if (!isDiscordConfigured()) {
      const demoSessionId = createSessionForUser({ id: 'local-dev', username: 'phoenix' });
      setSessionCookie(res, demoSessionId);
      redirect(res, '/nexus-console.html');
      return;
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) {
      sendHtml(res, 400, '<h2>Discord login failed</h2>');
      return;
    }

    (async () => {
      try {
        const { user, sessionId } = await handleDiscordCallback(code, state);
        setSessionCookie(res, sessionId);
        redirect(res, '/nexus-console.html');
        console.log(`Authenticated Discord user: ${user.username}`);
      } catch (error) {
        sendHtml(res, 401, `<h2>Discord login failed</h2><p>${error.message}</p>`);
      }
    })();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/dashboard') {
    const session = getSessionFromRequest(req);
    if (!session) {
      sendJson(res, 401, { ok: false, message: 'Unauthorized' });
      return;
    }
    sendJson(res, 200, {
      ...state,
      status: {
        ...state.status,
        lastSync: new Date().toISOString()
      }
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/bot/update') {
    readJsonBody(req, payload => {
      if (!payload || typeof payload !== 'object') {
        sendJson(res, 400, { ok: false, message: 'Invalid payload' });
        return;
      }

      state = {
        ...state,
        ...payload,
        status: {
          ...state.status,
          ...payload.status,
          lastSync: new Date().toISOString()
        }
      };

      sendJson(res, 200, { ok: true, received: payload, state });
    });
    return;
  }

  const pathname = url.pathname === '/' ? '/nexus-console.html' : url.pathname;
  const filePath = path.join(ROOT, pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath);
    return;
  }

  sendText(res, 404, 'Not found');
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Dashboard API listening on http://127.0.0.1:${PORT}`);
  });
}

module.exports = {
  createSessionForUser,
  isDiscordConfigured
};
