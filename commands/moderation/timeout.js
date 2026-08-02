/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Pune un utilizator in timeout')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub => sub.setName('add').setDescription('Aplica timeout')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true))
      .addStringOption(o => o.setName('durata').setDescription('Durata (ex: 10m, 1h, 1d)').setRequired(true))
      .addStringOption(o => o.setName('motiv').setDescription('Motivul').setRequired(false)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Elimina timeout')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true))
      .addStringOption(o => o.setName('motiv').setDescription('Motivul').setRequired(false))),
  cooldown: 5,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getMember('utilizator');
    const motiv = interaction.options.getString('motiv') ?? 'Fara motiv specificat';

    if (!target) return interaction.reply({ embeds: [errorEmbed('Utilizatorul nu e pe server.')], flags: MessageFlags.Ephemeral });
    if (!target.moderatable) return interaction.reply({ embeds: [errorEmbed('Nu pot modera acest utilizator.')], flags: MessageFlags.Ephemeral });

    if (sub === 'add') {
      const durata = interaction.options.getString('durata');
      const ms_durata = ms(durata);
      if (!ms_durata || ms_durata > 2419200000) return interaction.reply({ embeds: [errorEmbed('Durata invalida. Max 28d.')], flags: MessageFlags.Ephemeral });
      try {
        await target.timeout(ms_durata, `${motiv} | Timeout de: ${interaction.user.tag}`);
        await interaction.reply({ embeds: [successEmbed(`**${target.user.tag}** a primit timeout de **${durata}**.\n**Motiv:** ${motiv}`)] });
        await sendLog(interaction.guild, 'timeout', {
          user: target.user, moderator: interaction.user, reason: motiv, duration: durata,
          thumbnail: target.user.displayAvatarURL({ dynamic: true }),
        });
      } catch {
        await interaction.reply({ embeds: [errorEmbed('Nu am putut pune timeout.')], flags: MessageFlags.Ephemeral });
      }
    } else if (sub === 'remove') {
      try {
        await target.timeout(null, `${motiv} | Untimeout de: ${interaction.user.tag}`);
        await interaction.reply({ embeds: [successEmbed(`Timeout-ul lui **${target.user.tag}** a fost eliminat.`)] });
        await sendLog(interaction.guild, 'untimeout', {
          user: target.user, moderator: interaction.user, reason: motiv,
          thumbnail: target.user.displayAvatarURL({ dynamic: true }),
        });
      } catch {
        await interaction.reply({ embeds: [errorEmbed('Nu am putut elimina timeout-ul.')], flags: MessageFlags.Ephemeral });
      }
    }
  },
};
