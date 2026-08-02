/* by Capitanul burcea,alex */
const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'security',
  data: new SlashCommandBuilder()
    .setName('phx-security-hub')
    .setDescription('Phoenix Security Hub')
    .addSubcommand((sub) =>
      sub
        .setName('audit')
        .setDescription('Status rapid pentru security')
    )
    .addSubcommand((sub) =>
      sub
        .setName('lockdown')
        .setDescription('Plan recomandat pentru security')
    )
    .addSubcommand((sub) =>
      sub
        .setName('trust')
        .setDescription('Actiune operationala pentru security')
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
      .setTitle('Phoenix Security Hub')
      .setDescription('Mod feature-rich activ pe zona security.')
      .addFields(
        { name: 'Subcomanda', value: sub, inline: true },
        { name: 'Detaliu', value: detail, inline: true },
        { name: 'Operator', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
