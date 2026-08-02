/* by Capitanul burcea,alex */
const { SlashCommandBuilder } = require('discord.js');

function brief(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'Text invalid.';

  const parts = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length <= 2) return clean;

  const first = parts[0];
  const middle = parts[Math.floor(parts.length / 2)];
  const last = parts[parts.length - 1];
  return `${first} ${middle} ${last}`;
}

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('ai-brief')
    .setDescription('Rezumat rapid pentru un text')
    .addStringOption(option => option.setName('text').setDescription('Textul de rezumat').setRequired(true).setMaxLength(2000)),
  cooldown: 3,
  async execute(interaction) {
    const text = interaction.options.getString('text', true);
    return interaction.reply({ content: `Rezumat:\n${brief(text)}` });
  },
};
