/* by Capitanul burcea,alex */
const { SlashCommandBuilder } = require('discord.js');

function draft(yesterday, today, blockers) {
  return [
    'Standup draft:',
    `- Ieri: ${yesterday}`,
    `- Azi: ${today}`,
    `- Blocaje: ${blockers || 'niciun blocaj major'}`
  ].join('\n');
}

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('ai-standup')
    .setDescription('Genereaza un standup scurt in 3 puncte')
    .addStringOption(option => option.setName('yesterday').setDescription('Ce ai facut ieri').setRequired(true).setMaxLength(250))
    .addStringOption(option => option.setName('today').setDescription('Ce faci azi').setRequired(true).setMaxLength(250))
    .addStringOption(option => option.setName('blockers').setDescription('Blocaje').setRequired(false).setMaxLength(250)),
  cooldown: 2,
  async execute(interaction) {
    const yesterday = interaction.options.getString('yesterday', true);
    const today = interaction.options.getString('today', true);
    const blockers = interaction.options.getString('blockers');
    return interaction.reply({ content: draft(yesterday, today, blockers) });
  },
};
