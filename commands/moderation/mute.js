/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Muteaza un utilizator (chat sau voice)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(s => s.setName('chat')
      .setDescription('Muteaza un utilizator pe chat (timeout)')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true))
      .addStringOption(o => o.setName('durata').setDescription('Durata (ex: 10m, 1h, 1d)').setRequired(true))
      .addStringOption(o => o.setName('motiv').setDescription('Motivul').setRequired(false)))
    .addSubcommand(s => s.setName('voice')
      .setDescription('Muteaza un utilizator pe voice')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true))
      .addStringOption(o => o.setName('motiv').setDescription('Motivul').setRequired(false)))
    .addSubcommand(s => s.setName('unmute')
      .setDescription('Unmuteaza un utilizator (chat sau voice)')
      .addStringOption(o => o.setName('tip').setDescription('Tipul de unmute').setRequired(true)
        .addChoices({ name: 'Chat', value: 'chat' }, { name: 'Voice', value: 'voice' }))
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true))),
  
  cooldown: 5,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getMember('utilizator');
    const motiv = interaction.options.getString('motiv') ?? 'Fara motiv specificat';

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!target) return interaction.editReply({ embeds: [errorEmbed('Utilizatorul nu este pe server.')] });

    if (sub === 'chat') {
      if (!target.moderatable) return interaction.editReply({ embeds: [errorEmbed('Nu pot modera acest utilizator.')] });
      const durata = interaction.options.getString('durata');
      const ms_durata = ms(durata);
      if (!ms_durata || ms_durata > 2419200000) return interaction.editReply({ embeds: [errorEmbed('Durata invalida. Max 28d.')] });
      
      try {
        await target.timeout(ms_durata, `${motiv} | Mute Chat de: ${interaction.user.tag}`);
        await interaction.editReply({ embeds: [successEmbed(`**${target.user.tag}** a primit mute pe chat timp de **${durata}**.\n**Motiv:** ${motiv}`)] });
        await sendLog(interaction.guild, 'timeout', { user: target.user, moderator: interaction.user, reason: motiv, duration: durata });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed('Nu am putut aplica timeout.')] });
      }
    }

    if (sub === 'voice') {
      if (!target.voice.channel) return interaction.editReply({ embeds: [errorEmbed('Utilizatorul nu este intr-un canal vocal.')] });
      
      try {
        await target.voice.setMute(true, `${motiv} | Mute Voice de: ${interaction.user.tag}`);
        await interaction.editReply({ embeds: [successEmbed(`**${target.user.tag}** a primit mute pe voice.\n**Motiv:** ${motiv}`)] });
        await sendLog(interaction.guild, 'mute', { user: target.user, moderator: interaction.user, reason: motiv });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed('Nu am putut aplica voice mute.')] });
      }
    }

    if (sub === 'unmute') {
      const tip = interaction.options.getString('tip');
      
      try {
        if (tip === 'chat') {
          if (!target.moderatable) return interaction.editReply({ embeds: [errorEmbed('Nu pot modera acest utilizator.')] });
          await target.timeout(null, `Unmute Chat de: ${interaction.user.tag}`);
          await interaction.editReply({ embeds: [successEmbed(`Mute-ul pe chat al lui **${target.user.tag}** a fost eliminat.`)] });
          await sendLog(interaction.guild, 'untimeout', { user: target.user, moderator: interaction.user, reason: 'Unmute' });
        } else {
          if (!target.voice.channel) return interaction.editReply({ embeds: [errorEmbed('Utilizatorul nu este intr-un canal vocal.')] });
          await target.voice.setMute(false, `Unmute Voice de: ${interaction.user.tag}`);
          await interaction.editReply({ embeds: [successEmbed(`Mute-ul pe voice al lui **${target.user.tag}** a fost eliminat.`)] });
          await sendLog(interaction.guild, 'unmute', { user: target.user, moderator: interaction.user, reason: 'Unmute' });
        }
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed('Nu am putut elimina mute-ul.')] });
      }
    }
  }
};
