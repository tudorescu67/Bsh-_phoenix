/* by Capitanul burcea,alex */
const db = require('./database');

const STORE = 'message_triggers';
const VALID_MODES = new Set(['contains', 'exact', 'starts']);

function makeId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function cleanMode(mode) {
  return VALID_MODES.has(mode) ? mode : 'contains';
}

function normalize(text) {
  return String(text || '').trim().toLowerCase();
}

function listTriggers(guildId) {
  return Object.values(db.getAll(STORE) || {})
    .filter((trigger) => trigger && String(trigger.guildId) === String(guildId))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function addTrigger({ guildId, channelId = null, phrase, response, mode = 'contains', createdBy }) {
  const trigger = {
    id: makeId(),
    guildId,
    channelId,
    phrase: String(phrase || '').trim(),
    response: String(response || '').trim(),
    mode: cleanMode(mode),
    createdBy,
    enabled: true,
    uses: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  db.set(STORE, trigger.id, trigger);
  return trigger;
}

function removeTrigger(guildId, id) {
  const trigger = db.get(STORE, id);
  if (!trigger || String(trigger.guildId) !== String(guildId)) return false;
  db.del(STORE, id);
  return true;
}

function findMatchingTrigger(message) {
  const content = normalize(message.content);
  if (!content) return null;

  return listTriggers(message.guild.id)
    .filter((trigger) => trigger.enabled !== false)
    .filter((trigger) => !trigger.channelId || String(trigger.channelId) === String(message.channel.id))
    .sort((a, b) => String(b.phrase || '').length - String(a.phrase || '').length)
    .find((trigger) => {
      const phrase = normalize(trigger.phrase);
      if (!phrase) return false;
      if (trigger.mode === 'exact') return content === phrase;
      if (trigger.mode === 'starts') return content.startsWith(phrase);
      return content.includes(phrase);
    }) || null;
}

function renderResponse(trigger, message) {
  return String(trigger.response || '')
    .replaceAll('{user}', `${message.author}`)
    .replaceAll('{username}', message.author.username)
    .replaceAll('{server}', message.guild.name)
    .slice(0, 1900);
}

async function handleMessage(message) {
  const trigger = findMatchingTrigger(message);
  if (!trigger) return false;

  const response = renderResponse(trigger, message);
  if (!response) return false;

  await message.channel.send({ content: response }).catch(() => {});
  db.set(STORE, trigger.id, { ...trigger, uses: Number(trigger.uses || 0) + 1, updatedAt: Date.now() });
  return true;
}

module.exports = {
  addTrigger,
  listTriggers,
  removeTrigger,
  handleMessage,
};
