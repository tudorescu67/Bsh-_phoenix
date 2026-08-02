/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banneaza un membru de pe server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul de bannat').setRequired(true))
    .addStringOption(o => o.setName('motiv').setDescription('Motivul ban-ului').setRequired(false))
    .addIntegerOption(o => o.setName('stergere_mesaje').setDescription('Sterge mesajele din ultimele X zile (0-7)').setMinValue(0).setMaxValue(7).setRequired(false)),
  cooldown: 5,
  async execute(interaction) {
    const target = interaction.options.getMember('utilizator');
    const motiv = interaction.options.getString('motiv') ?? 'Fara motiv specificat';
    const deletedays = interaction.options.getInteger('stergere_mesaje') ?? 0;

    if (!target) return interaction.reply({ embeds: [errorEmbed('Utilizatorul nu e pe server.')], flags: MessageFlags.Ephemeral });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed('Nu te poti banna singur.')], flags: MessageFlags.Ephemeral });
    if (!target.bannable) return interaction.reply({ embeds: [errorEmbed('Nu pot banna acest utilizator (roluri superioare).')], flags: MessageFlags.Ephemeral });

    try {
      await target.ban({ deleteMessageSeconds: deletedays * 86400, reason: `${motiv} | Ban de: ${interaction.user.tag}` });
      await interaction.reply({ embeds: [successEmbed(`**${target.user.tag}** a fost bannat.\n**Motiv:** ${motiv}`)] });
      await sendLog(interaction.guild, 'ban', {
        user: target.user, moderator: interaction.user, reason: motiv,
        extra: deletedays > 0 ? `Mesaje sterse: ultimele **${deletedays}** zile` : null,
        thumbnail: target.user.displayAvatarURL({ dynamic: true }),
      });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('Nu am putut banna utilizatorul.')], flags: MessageFlags.Ephemeral });
    }
  },
};
