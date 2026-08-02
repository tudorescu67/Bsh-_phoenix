/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kickeaza un membru de pe server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul de kickat').setRequired(true))
    .addStringOption(o => o.setName('motiv').setDescription('Motivul kick-ului').setRequired(false)),
  cooldown: 5,
  async execute(interaction) {
    const target = interaction.options.getMember('utilizator');
    const motiv = interaction.options.getString('motiv') ?? 'Fara motiv specificat';
    if (!target) return interaction.reply({ embeds: [errorEmbed('Utilizatorul nu e pe server.')], flags: MessageFlags.Ephemeral });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed('Nu te poti kicka singur.')], flags: MessageFlags.Ephemeral });
    if (!target.kickable) return interaction.reply({ embeds: [errorEmbed('Nu pot kicka acest utilizator.')], flags: MessageFlags.Ephemeral });
    try {
      await target.kick(`${motiv} | Kick de: ${interaction.user.tag}`);
      await interaction.reply({ embeds: [successEmbed(`**${target.user.tag}** a fost kickat.\n**Motiv:** ${motiv}`)] });
      await sendLog(interaction.guild, 'kick', {
        user: target.user, moderator: interaction.user, reason: motiv,
        thumbnail: target.user.displayAvatarURL({ dynamic: true }),
      });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('Nu am putut kicka utilizatorul.')], flags: MessageFlags.Ephemeral });
    }
  },
};
