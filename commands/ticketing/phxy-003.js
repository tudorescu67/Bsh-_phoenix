/* by Capitanul burcea,alex */
const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('phx-ticketing-hub')
    .setDescription('Phoenix Ticketing Hub')
    .addSubcommand((sub) =>
      sub
        .setName('open')
        .setDescription('Status rapid pentru ticketing')
    )
    .addSubcommand((sub) =>
      sub
        .setName('close')
        .setDescription('Plan recomandat pentru ticketing')
    )
    .addSubcommand((sub) =>
      sub
        .setName('escalate')
        .setDescription('Actiune operationala pentru ticketing')
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
      .setTitle('Phoenix Ticketing Hub')
      .setDescription('Mod feature-rich activ pe zona ticketing.')
      .addFields(
        { name: 'Subcomanda', value: sub, inline: true },
        { name: 'Detaliu', value: detail, inline: true },
        { name: 'Operator', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
