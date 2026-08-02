/* by Capitanul burcea,alex */
const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('phx-community-hub')
    .setDescription('Phoenix Community Hub')
    .addSubcommand((sub) =>
      sub
        .setName('pulse')
        .setDescription('Status rapid pentru community')
    )
    .addSubcommand((sub) =>
      sub
        .setName('announce')
        .setDescription('Plan recomandat pentru community')
    )
    .addSubcommand((sub) =>
      sub
        .setName('roadmap')
        .setDescription('Actiune operationala pentru community')
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
      .setTitle('Phoenix Community Hub')
      .setDescription('Mod feature-rich activ pe zona community.')
      .addFields(
        { name: 'Subcomanda', value: sub, inline: true },
        { name: 'Detaliu', value: detail, inline: true },
        { name: 'Operator', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
