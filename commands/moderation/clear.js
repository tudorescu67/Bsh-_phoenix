/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Sterge mesaje din canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName('numar').setDescription('Numarul de mesaje de sters (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
    .addUserOption(o => o.setName('utilizator').setDescription('Sterge doar mesajele acestui user').setRequired(false)),
  cooldown: 5,
  async execute(interaction) {
    const numar = interaction.options.getInteger('numar');
    const filterUser = interaction.options.getUser('utilizator');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      let messages = await interaction.channel.messages.fetch({ limit: 100 });
      if (filterUser) messages = messages.filter(m => m.author.id === filterUser.id).first(numar);
      else messages = messages.first(numar);
      const recent = messages instanceof Map
        ? [...messages.values()].filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000)
        : messages.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
      const deleted = await interaction.channel.bulkDelete(recent, true);
      await interaction.editReply({ embeds: [successEmbed(`Am sters **${deleted.size}** mesaje.`)] });
      await sendLog(interaction.guild, 'clear', {
        moderator: interaction.user, channel: interaction.channel,
        count: deleted.size,
        extra: filterUser ? `Filtrat dupa: **${filterUser.tag}**` : null,
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ embeds: [errorEmbed('Nu am putut sterge mesajele.')] });
    }
  },
};
