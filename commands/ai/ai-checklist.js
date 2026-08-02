/* by Capitanul burcea,alex */
const { SlashCommandBuilder } = require('discord.js');

function buildChecklist(goal) {
  const g = String(goal || '').trim();
  return [
    `Obiectiv: ${g}`,
    '1. Defineste ce inseamna done in 1-2 propoziții.',
    '2. Sparge task-ul in 3 actiuni mici executabile.',
    '3. Stabileste responsabil, deadline si risc principal.',
    '4. Ruleaza verificare finala si logheaza rezultatul.'
  ].join('\n');
}

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('ai-checklist')
    .setDescription('Genereaza checklist rapid pentru un obiectiv')
    .addStringOption(option => option.setName('goal').setDescription('Obiectiv').setRequired(true).setMaxLength(300)),
  cooldown: 3,
  async execute(interaction) {
    const goal = interaction.options.getString('goal', true);
    return interaction.reply({ content: buildChecklist(goal) });
  },
};
