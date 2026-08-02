/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { listText, templateChoices, templateMessage } = require('../../utils/templateCatalog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('template')
    .setDescription('Arata template-uri de pluginuri pentru game servers')
    .addStringOption(option =>
      option
        .setName('game')
        .setDescription('Alege jocul')
        .setRequired(false)
        .addChoices(...templateChoices())
    )
    .addStringOption(option =>
      option
        .setName('file')
        .setDescription('File id optional: plugin, server, config, readme')
        .setRequired(false)
    ),

  async execute(interaction) {
    const game = interaction.options.getString('game');
    const file = interaction.options.getString('file');

    if (!game) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('BSH Game Plugin Templates')
            .setDescription(`Alege un template cu /template game:<id>.\n\n${listText()}`),
        ],
        ephemeral: true,
      });
    }

    const message = templateMessage(game, file);
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(message.ok ? 0x5865F2 : 0xFEE75C)
          .setTitle(message.title)
          .setDescription(message.description),
      ],
      ephemeral: true,
    });
  },
};
