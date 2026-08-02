/* by Capitanul burcea,alex */
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  if (fs.lstatSync(commandsPath).isDirectory()) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      if ('data' in command && 'execute' in command) commands.push(command.data.toJSON());
    }
  } else if (commandsPath.endsWith('.js')) {
    const command = require(commandsPath);
    if ('data' in command && 'execute' in command) commands.push(command.data.toJSON());
  }
}

// Folosim variabilele din .env
const clientId = process.env.CLIENT_ID;
const guildId  = process.env.GUILD_ID;
const token    = process.env.DISCORD_TOKEN;

function isPlaceholder(value) {
  return typeof value === 'string' && /REPLACE|token_tau_aici|id_bot_aici|id_server_aici/i.test(value.trim());
}

if (!clientId || !guildId || !token || isPlaceholder(clientId) || isPlaceholder(guildId) || isPlaceholder(token)) {
  console.error('❌ .env nu este completat corect. Completeaza valorile reale pentru CLIENT_ID, GUILD_ID si DISCORD_TOKEN in .env.');
  process.exit(1);
}

const rest = new REST().setToken(token);

async function deployCommands(route) {
  const data = await rest.put(route, { body: commands });
  return data;
}

(async () => {
  try {
    console.log(`Se incarca ${commands.length} comenzi slash...`);

    try {
      const data = await deployCommands(Routes.applicationGuildCommands(clientId, guildId));
      console.log(`✅ Succes! Am incarcat ${data.length} comenzi in guild ${guildId}.`);
    } catch (error) {
      if (error?.code === 50001 || error?.status === 403) {
        console.warn('⚠️ Deploy in guild a esuat (Missing Access). Incerc deploy global...');
        const data = await deployCommands(Routes.applicationCommands(clientId));
        console.log(`✅ Succes! Am incarcat ${data.length} comenzi global.`);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Eroare la deploy comenzi:', error?.message || error);
    if (error?.rawError?.message) {
      console.error('Detalii Discord:', error.rawError.message);
    }
    process.exit(1);
  }
})();
