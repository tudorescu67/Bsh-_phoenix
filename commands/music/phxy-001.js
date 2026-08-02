/* by Capitanul burcea,alex */
const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('phx-music-hub')
    .setDescription('Phoenix Music Hub')
    .addSubcommand((sub) =>
      sub
        .setName('queue')
        .setDescription('Status rapid pentru music')
    )
    .addSubcommand((sub) =>
      sub
        .setName('fallback')
        .setDescription('Plan recomandat pentru music')
    )
    .addSubcommand((sub) =>
      sub
        .setName('playmode')
        .setDescription('Actiune operationala pentru music')
        .addStringOption((option) =>
          option
            .setName('detaliu')
            .setDescription('Detaliu optional')
            .setRequired(false)
        )
    ),
  cooldown: 5,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const detail = interaction.options.getString('detaliu') || 'n/a';
    const embed = new EmbedBuilder()
      .setColor(0x00e5ff)
      .setTitle('Phoenix Music Hub')
      .setDescription('Mod feature-rich activ pe zona music.')
      .addFields(
        { name: 'Subcomanda', value: sub, inline: true },
        { name: 'Detaliu', value: detail, inline: true },
        { name: 'Operator', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
