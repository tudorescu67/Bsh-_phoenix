/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Dezbanneaza un utilizator dupa ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o => o.setName('id').setDescription('ID-ul utilizatorului').setRequired(true))
    .addStringOption(o => o.setName('motiv').setDescription('Motivul').setRequired(false)),
  cooldown: 5,
  async execute(interaction) {
    const userId = interaction.options.getString('id');
    const motiv = interaction.options.getString('motiv') ?? 'Fara motiv specificat';
    try {
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!ban) return interaction.reply({ embeds: [errorEmbed('Utilizatorul nu este bannat.')], flags: MessageFlags.Ephemeral });
      await interaction.guild.members.unban(userId, motiv);
      await interaction.reply({ embeds: [successEmbed(`**${ban.user.tag}** a fost dezbannat.\n**Motiv:** ${motiv}`)] });
      await sendLog(interaction.guild, 'unban', {
        user: ban.user, moderator: interaction.user, reason: motiv,
        thumbnail: ban.user.displayAvatarURL({ dynamic: true }),
      });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('ID invalid sau utilizatorul nu este bannat.')], flags: MessageFlags.Ephemeral });
    }
  },
};
