/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Creaza un sondaj')
    .addStringOption(o => o.setName('intrebare').setDescription('Intrebarea sondajului').setRequired(true))
    .addStringOption(o => o.setName('optiuni').setDescription('Optiunile separate prin virgula (min 2, max 10)').setRequired(true))
    .addIntegerOption(o => o.setName('durata').setDescription('Durata in minute (optional)').setMinValue(1).setMaxValue(10080)),
  cooldown: 10,
  async execute(interaction) {
    const intrebare = interaction.options.getString('intrebare');
    const optiuni = interaction.options.getString('optiuni').split(',').map(s => s.trim()).filter(Boolean);
    const durata = interaction.options.getInteger('durata');

    if (optiuni.length < 2 || optiuni.length > 10)
      return interaction.reply({ content: '❌ Trebuie sa ai intre 2 si 10 optiuni.', flags: MessageFlags.Ephemeral });

    const desc = optiuni.map((o, i) => `${EMOJIS[i]} ${o}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${intrebare}`)
      .setDescription(desc)
      .setFooter({ text: `Sondaj de ${interaction.user.tag}${durata ? ` • Expira in ${durata}min` : ''}` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    for (let i = 0; i < optiuni.length; i++) await msg.react(EMOJIS[i]);

    if (durata) {
      setTimeout(async () => {
        const fetched = await msg.fetch();
        const results = optiuni.map((o, i) => {
          const count = (fetched.reactions.cache.get(EMOJIS[i])?.count ?? 1) - 1;
          return `${EMOJIS[i]} **${o}** — ${count} voturi`;
        });
        const resultEmbed = new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle(`📊 Rezultate: ${intrebare}`)
          .setDescription(results.join('\n'))
          .setTimestamp();
        fetched.reply({ embeds: [resultEmbed] });
      }, durata * 60000);
    }
  },
};
