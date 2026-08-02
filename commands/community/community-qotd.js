/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const QUESTIONS = [
  'Ce feature nou ai vrea pe server?',
  'Ce te motiveaza sa ramai activ in comunitate?',
  'Care comanda te ajuta cel mai mult?',
  'Ce event ai organiza weekendul asta?',
  'Ce regula ai clarifica pentru server?'
];

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-qotd')
    .setDescription('Question of the day pentru comunitate'),
  cooldown: 2,
  async execute(interaction) {
    const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('QOTD')
      .setDescription(question)
      .setFooter({ text: `Postat de ${interaction.user.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
