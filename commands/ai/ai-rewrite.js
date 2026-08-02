/* by Capitanul burcea,alex */
const { SlashCommandBuilder } = require('discord.js');

function rewrite(style, text) {
  const cleaned = String(text || '').trim();
  if (style === 'formal') return `Varianta formala:\n${cleaned}\n\nTe rog sa tratezi acest subiect cu prioritate si claritate.`;
  if (style === 'short') return `Varianta scurta:\n${cleaned.slice(0, 160)}`;
  return `Varianta friendly:\n${cleaned}\n\nMersi mult pentru implicare!`;
}

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('ai-rewrite')
    .setDescription('Rescrie rapid un text pe stil diferit')
    .addStringOption(option =>
      option.setName('style')
        .setDescription('Stilul dorit')
        .setRequired(true)
        .addChoices(
          { name: 'Formal', value: 'formal' },
          { name: 'Short', value: 'short' },
          { name: 'Friendly', value: 'friendly' }
        )
    )
    .addStringOption(option => option.setName('text').setDescription('Textul initial').setRequired(true).setMaxLength(500)),
  cooldown: 2,
  async execute(interaction) {
    const style = interaction.options.getString('style', true);
    const text = interaction.options.getString('text', true);
    return interaction.reply({ content: rewrite(style, text) });
  },
};
