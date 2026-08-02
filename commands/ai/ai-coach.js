/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function coach(topic) {
  const t = String(topic || '').toLowerCase();
  if (t.includes('moder')) return 'Fa reguli clare, sanctiuni graduale si log transparent pentru fiecare actiune.';
  if (t.includes('event')) return 'Seteaza scop, durata, reward si post-eveniment cu concluzii publice.';
  if (t.includes('ticket')) return 'Folosește prioritate, SLA simplu si template standard pentru raspunsuri.';
  return 'Porneste cu obiectiv clar, public tinta, deadline si un indicator simplu de succes.';
}

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('ai-coach')
    .setDescription('Coach AI rapid pentru server management')
    .addStringOption(option => option.setName('topic').setDescription('Tema').setRequired(true).setMaxLength(300)),
  cooldown: 3,
  async execute(interaction) {
    const topic = interaction.options.getString('topic', true);
    const answer = coach(topic);

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle('AI Coach')
      .addFields(
        { name: 'Topic', value: topic.slice(0, 1024) },
        { name: 'Recomandare', value: answer.slice(0, 1024) }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
