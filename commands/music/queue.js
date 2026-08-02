/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const mm = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Afiseaza coada de melodii')
    .addIntegerOption(o => o.setName('pagina').setDescription('Pagina').setMinValue(1)),
  cooldown: 3,
  async execute(interaction) {
    const q = mm.getQueueData(interaction.guild.id);
    if (!q || (!q.current && !q.queue.length)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setDescription('📭 Coada este goala.')], flags: MessageFlags.Ephemeral });

    const page = (interaction.options.getInteger('pagina') ?? 1) - 1;
    const perPage = 10;
    const total = q.queue.length;
    const pages = Math.ceil(total / perPage) || 1;
    const slice = q.queue.slice(page * perPage, (page + 1) * perPage);

    const lines = slice.map((s, i) => `**${page * perPage + i + 1}.** [${s.title}](${s.url}) \`${s.duration}\` — ${s.requester}`);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎵 Coada de melodii')
      .addFields(
        { name: '▶️ Se reda acum', value: q.current ? `[${q.current.title}](${q.current.url}) \`${q.current.duration}\`` : 'Nimic' },
      )
      .setFooter({ text: `Pagina ${page+1}/${pages} • ${total} melodii in coada • Loop: ${q.looping ? 'ON' : 'OFF'}` });

    if (lines.length) embed.addFields({ name: '📋 Urmatoarele', value: lines.join('\n') });

    await interaction.reply({ embeds: [embed] });
  },
};
