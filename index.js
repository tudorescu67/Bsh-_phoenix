/* by Capitanul burcea,alex */
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,       // ban, unban events
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildInvites,          // invite tracking
    GatewayIntentBits.GuildPresences,
  ],
  partials: [
    Partials.Message,   // pentru messageDelete pe mesaje vechi
    Partials.Channel,
    Partials.GuildMember,
    Partials.Reaction,  // necesar pentru verificare prin reactie pe mesaje vechi
  ],
});

client.commands = new Collection();
client.cooldowns = new Collection();

const fs = require('fs');
const path = require('path');
const db = require('./utils/database');
const { sendLog } = require('./utils/logger');
const play = require('play-dl');

// â”€â”€ IniÈ›ializare play-dl â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function initPlayDL() {
  try {
    await play.setToken({ youtube: { cookie: undefined } }).catch(() => {});
    console.log('[Music] YouTube cookies disabled for Linux VPS. Using no-cookie playback/fallback.');
  } catch (err) {
    console.error('[Music] Error resetting YouTube cookies:', err);
  }
}
initPlayDL();

let lastGlobalErrorLog = 0;
const GLOBAL_ERROR_LOG_COOLDOWN_MS = Number(process.env.GLOBAL_ERROR_LOG_COOLDOWN_MS) || 60000;

async function logGlobalError(type, error, extra) {
  const now = Date.now();
  if (now - lastGlobalErrorLog < GLOBAL_ERROR_LOG_COOLDOWN_MS) return;
  lastGlobalErrorLog = now;

  const guild = client.guilds.cache.first();
  if (!guild) return;

  await sendLog(guild, 'error', {
    title: type,
    description: `\`\`\`js\n${String(error?.stack || error).slice(0, 1700)}\n\`\`\``,
    extra,
  }).catch(() => {});
}

// â”€â”€ Capturare Erori Globale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
  logGlobalError('Eroare Bot (Unhandled Rejection)', reason, `Timestamp: <t:${Math.floor(Date.now() / 1000)}:F>`);
  return;
  client.guilds.cache.forEach(guild => {
    sendLog(guild, 'error', {
      title: 'âŒ Eroare Bot (Unhandled Rejection)',
      description: `**Motiv:** \`\`\`js\n${reason.stack || reason}\n\`\`\``,
      extra: `Timestamp: <t:${Math.floor(Date.now() / 1000)}:F>`
    }).catch(() => {});
  });
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  logGlobalError('Eroare Bot (Uncaught Exception)', err, 'Botul ar putea necesita restart manual daca erorile persista.');
  return;
  client.guilds.cache.forEach(guild => {
    sendLog(guild, 'error', {
      title: 'âŒ Eroare Bot (Uncaught Exception)',
      description: `**Eroare:** \`\`\`js\n${err.stack || err}\n\`\`\``,
      extra: 'Botul ar putea necesita restart manual dacÄƒ erorile persistÄƒ.'
    }).catch(() => {});
  });
});

// â”€â”€ Load Commands â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  if (!fs.lstatSync(commandsPath).isDirectory()) continue;
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARN] Comanda ${file} nu are "data" sau "execute".`);
    }
  }
}

// â”€â”€ Load Events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const eventFiles = fs.readdirSync('./events').filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.login(process.env.DISCORD_TOKEN);

