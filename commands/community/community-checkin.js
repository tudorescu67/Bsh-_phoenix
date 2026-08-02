/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const prompts = [
  'Ce a mers bine azi in comunitate?',
  'Unde ai vazut cel mai mult engagement?',
  'Ce putem imbunatati pana maine?',
  'Ce canal a fost cel mai util in ultimele ore?'
];

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-checkin')
    .setDescription('Lanseaza un check-in rapid pentru comunitate'),
  cooldown: 5,
  async execute(interaction) {
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('Community check-in')
      .setDescription(prompt)
      .setFooter({ text: `Initiat de ${interaction.user.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
