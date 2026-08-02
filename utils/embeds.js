/* by Capitanul burcea,alex */
const { EmbedBuilder } = require('discord.js');

const successEmbed = (desc, title) => {
  const e = new EmbedBuilder().setColor(0x57f287).setDescription(`✅ ${desc}`);
  if (title) e.setTitle(title);
  return e;
};

const errorEmbed = (desc, title) => {
  const e = new EmbedBuilder().setColor(0xed4245).setDescription(`❌ ${desc}`);
  if (title) e.setTitle(title);
  return e;
};

const infoEmbed = (desc, title) => {
  const e = new EmbedBuilder().setColor(0x5865f2).setDescription(desc);
  if (title) e.setTitle(title);
  return e;
};

const warnEmbed = (desc, title) => {
  const e = new EmbedBuilder().setColor(0xfee75c).setDescription(`⚠️ ${desc}`);
  if (title) e.setTitle(title);
  return e;
};

module.exports = {
  successEmbed, errorEmbed, infoEmbed, warnEmbed,
  // Alias-uri pentru compatibilitate cu cod vechi
  success: successEmbed,
  error: errorEmbed,
  info: infoEmbed,
  warn: warnEmbed,
};
