/* by Capitanul burcea,alex */
const { SlashCommandBuilder } = require('discord.js');

const IDEAS = {
  event: [
    'Mini-turneu 1v1 cu bracket simplu si finala pe voice.',
    'QOTD zilnic + reward simbolic pentru participare.',
    'Seara de feedback pentru roadmap-ul comunitatii.'
  ],
  moderation: [
    'Template unic pentru warns cu exemple clare.',
    'Review saptamanal al top-ului de incidente.',
    'Canal intern de decizii pentru transparenta staff.'
  ],
  growth: [
    'Program de invitatii cu recompense etapizate.',
    'Postari automate cu highlights comunitate.',
    'Onboarding ghidat pentru membri noi.'
  ],
};

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('ai-idea')
    .setDescription('Genereaza o idee rapida pe o tema')
    .addStringOption(option =>
      option.setName('topic')
        .setDescription('Tema ideii')
        .setRequired(true)
        .addChoices(
          { name: 'Event', value: 'event' },
          { name: 'Moderation', value: 'moderation' },
          { name: 'Growth', value: 'growth' }
        )
    ),
  cooldown: 2,
  async execute(interaction) {
    const topic = interaction.options.getString('topic', true);
    const pool = IDEAS[topic] || IDEAS.growth;
    const pick = pool[Math.floor(Math.random() * pool.length)];

    return interaction.reply({ content: `Idee (${topic}): ${pick}` });
  },
};
