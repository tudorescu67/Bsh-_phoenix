/* by Capitanul burcea,alex */
const { SlashCommandBuilder } = require('discord.js');

function buildPlan(goal) {
  return [
    `Obiectiv: ${goal}`,
    '1. Defineste rezultatul final in 1-2 propoziții.',
    '2. Imparte in 3 pasi executabili cu prioritate.',
    '3. Atribuie owner, deadline si risc principal.',
    '4. Ruleaza verificare finala si noteaza lectiile.'
  ].join('\n');
}

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('ai-plan')
    .setDescription('Genereaza un plan de executie scurt')
    .addStringOption(option => option.setName('goal').setDescription('Obiectiv').setRequired(true).setMaxLength(300)),
  cooldown: 3,
  async execute(interaction) {
    const goal = interaction.options.getString('goal', true);
    return interaction.reply({ content: buildPlan(goal) });
  },
};
