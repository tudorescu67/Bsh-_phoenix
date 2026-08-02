/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const raspunsuri = [
  '✅ Da, cu siguranta!', '✅ Absolut!', '✅ Toate semnele arata spre da.',
  '✅ Cel mai probabil.', '⚠️ Perspectiva nu e clara, incearca din nou.',
  '⚠️ Nu te baza pe asta.', '❌ Perspective nu sunt bune.',
  '❌ Nu.', '❌ Cu siguranta nu.', '❌ Raspunsul meu e nu.',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Intreaba bila magica')
    .addStringOption(o => o.setName('intrebare').setDescription('Intrebarea ta').setRequired(true)),
  cooldown: 3,
  async execute(interaction) {
    const intrebare = interaction.options.getString('intrebare');
    const raspuns = raspunsuri[Math.floor(Math.random() * raspunsuri.length)];
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎱 Bila Magica')
      .addFields(
        { name: '❓ Intrebare', value: intrebare },
        { name: '🎱 Raspuns', value: raspuns }
      );
    await interaction.reply({ embeds: [embed] });
  },
};
