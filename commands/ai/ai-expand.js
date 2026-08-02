/* by Capitanul burcea,alex */
const { SlashCommandBuilder } = require('discord.js');

function expand(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return [
    `Text de baza: ${clean}`,
    '',
    'Extindere propusa:',
    `- Context: ${clean}`,
    '- Impact: creste claritatea pentru membri si staff.',
    '- Actiuni: defineste owner, termen, canale de comunicare.',
    '- Follow-up: revizuire in 24h cu status public.'
  ].join('\n');
}

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('ai-expand')
    .setDescription('Extinde un mesaj scurt intr-un plan clar')
    .addStringOption(option => option.setName('text').setDescription('Textul sursa').setRequired(true).setMaxLength(400)),
  cooldown: 2,
  async execute(interaction) {
    const text = interaction.options.getString('text', true);
    return interaction.reply({ content: expand(text) });
  },
};
