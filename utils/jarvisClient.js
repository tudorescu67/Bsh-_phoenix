/* by Capitanul burcea,alex */
const axios = require('axios');

const DEFAULT_JARVIS_URL = 'http://127.0.0.1:5055';

async function askJarvisMessage(message, context = {}) {
  const baseUrl = String(process.env.JARVIS_API_URL || DEFAULT_JARVIS_URL).replace(/\/+$/, '');
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.JARVIS_API_TOKEN) headers['X-Jarvis-Token'] = process.env.JARVIS_API_TOKEN;

  const response = await axios.post(`${baseUrl}/ask`, {
    question: message,
    source: context.source || 'discord',
    userId: context.userId,
    username: context.username,
    guildId: context.guildId,
    guildName: context.guildName,
    channelId: context.channelId,
    channelName: context.channelName,
  }, {
    headers,
    timeout: Number(process.env.JARVIS_API_TIMEOUT_MS || 30000),
  });

  return response.data;
}

async function askJarvis(message, interaction) {
  return askJarvisMessage(message, {
    source: 'discord',
    userId: interaction.user?.id,
    username: interaction.user?.tag || interaction.user?.username,
    guildId: interaction.guild?.id,
    guildName: interaction.guild?.name,
    channelId: interaction.channel?.id,
    channelName: interaction.channel?.name,
  });
}

module.exports = { askJarvis, askJarvisMessage };
