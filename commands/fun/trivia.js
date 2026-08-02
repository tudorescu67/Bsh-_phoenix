/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const intrebari = [
  { q: 'Care e capitala Romaniei?', a: 'Bucuresti', optiuni: ['Cluj', 'Bucuresti', 'Timisoara', 'Iasi'] },
  { q: 'Cate planete are sistemul solar?', a: '8', optiuni: ['7', '8', '9', '10'] },
  { q: 'In ce an s-a fondat Discord?', a: '2015', optiuni: ['2013', '2014', '2015', '2016'] },
  { q: 'Ce limbaj de programare este asociat cu NodeJS?', a: 'JavaScript', optiuni: ['Python', 'Java', 'JavaScript', 'Ruby'] },
  { q: 'Care e cel mai mare ocean?', a: 'Pacific', optiuni: ['Atlantic', 'Indian', 'Pacific', 'Arctic'] },
  { q: 'Cati biti are un byte?', a: '8', optiuni: ['4', '8', '16', '32'] },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Joaca trivia!'),
  cooldown: 10,
  async execute(interaction) {
    const q = intrebari[Math.floor(Math.random() * intrebari.length)];
    const shuffled = [...q.optiuni].sort(() => Math.random() - 0.5);

    const row = new ActionRowBuilder().addComponents(
      shuffled.map(opt =>
        new ButtonBuilder()
          .setCustomId(`trivia_${opt}`)
          .setLabel(opt)
          .setStyle(ButtonStyle.Primary)
      )
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🧠 Trivia!')
      .setDescription(`**${q.q}**`)
      .setFooter({ text: 'Ai 20 secunde sa raspunzi!' });

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 20000 });

    collector.on('collect', async i => {
      const ales = i.customId.replace('trivia_', '');
      const correct = ales === q.a;
      const resultEmbed = new EmbedBuilder()
        .setColor(correct ? 0x57f287 : 0xed4245)
        .setTitle(correct ? '✅ Corect!' : '❌ Gresit!')
        .setDescription(correct ? `Felicitari ${i.user}! Raspunsul corect era **${q.a}**.` : `Gresit, ${i.user}. Raspunsul corect era **${q.a}**.`);

      await i.reply({ embeds: [resultEmbed] });
      collector.stop();
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = new EmbedBuilder().setColor(0xed4245).setDescription(`⏰ Timpul a expirat! Raspunsul era **${q.a}**.`);
        await interaction.followUp({ embeds: [timeoutEmbed] });
      }
      // Dezactiveaza butoanele
      const disabled = new ActionRowBuilder().addComponents(
        shuffled.map(opt =>
          new ButtonBuilder()
            .setCustomId(`trivia_${opt}`)
            .setLabel(opt)
            .setStyle(opt === q.a ? ButtonStyle.Success : ButtonStyle.Danger)
            .setDisabled(true)
        )
      );
      await msg.edit({ components: [disabled] }).catch(() => {});
    });
  },
};
