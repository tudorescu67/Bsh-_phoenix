/* by Capitanul burcea,alex */
const { SlashCommandBuilder } = require('discord.js');
const onboarding = require('../../utils/onboardingSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('intrebari')
    .setDescription('Completeaza profilul de inceput BSH')
    .addSubcommand((subcommand) => subcommand
      .setName('start')
      .setDescription('Raspunde la primele 5 intrebari si primeste rolurile de inceput'))
    .addSubcommand((subcommand) => subcommand
      .setName('extra')
      .setDescription('Raspunde la intrebari extra despre muzica, art, programare si DJ'))
    .addSubcommand((subcommand) => subcommand
      .setName('status')
      .setDescription('Vezi raspunsurile tale salvate')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'status') return onboarding.showStatus(interaction);
    return onboarding.openModal(interaction, subcommand === 'extra' ? 'extra' : 'core');
  },
};
