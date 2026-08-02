/* by Capitanul burcea,alex */
const { ChannelType, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const cameraOnly = require('../../utils/cameraOnlySystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cameraonly')
    .setDescription('Canale voice unde camera trebuie pornita in maxim 30s')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) => subcommand
      .setName('setup')
      .setDescription('Activeaza camera obligatorie')
      .addChannelOption((option) => option.setName('channel').setDescription('Canal voice').addChannelTypes(ChannelType.GuildVoice).setRequired(true))
      .addIntegerOption((option) => option.setName('grace_seconds').setDescription('Secunde pana la disconnect').setMinValue(5).setMaxValue(300))
      .addChannelOption((option) => option.setName('notice_channel').setDescription('Canal text avertizari').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
      .addRoleOption((option) => option.setName('exempt_role').setDescription('Rol exceptat')))
    .addSubcommand((subcommand) => subcommand
      .setName('disable')
      .setDescription('Dezactiveaza camera-only')
      .addChannelOption((option) => option.setName('channel').setDescription('Canal voice').addChannelTypes(ChannelType.GuildVoice).setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Listeaza camerele camera-only')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'setup') {
      const channel = interaction.options.getChannel('channel', true);
      const graceSeconds = interaction.options.getInteger('grace_seconds') || 30;
      const noticeChannel = interaction.options.getChannel('notice_channel');
      const exemptRole = interaction.options.getRole('exempt_role');

      cameraOnly.setCameraOnly({
        guildId: interaction.guild.id,
        channelId: channel.id,
        graceSeconds,
        noticeChannelId: noticeChannel?.id || null,
        exemptRoleId: exemptRole?.id || null,
      });

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x00d9ff).setDescription(`Camera-only activ pe ${channel}. Userii au **${graceSeconds}s** sa porneasca camera.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === 'disable') {
      const channel = interaction.options.getChannel('channel', true);
      const removed = cameraOnly.removeCameraOnly(interaction.guild.id, channel.id);
      return interaction.reply({
        content: removed ? `Camera-only dezactivat pe ${channel}.` : `${channel} nu era configurat camera-only.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const rows = cameraOnly.listCameraOnly(interaction.guild.id);
    const description = rows.length
      ? rows.map((row) => {
        const notice = row.noticeChannelId ? `<#${row.noticeChannelId}>` : 'DM / chat voice';
        const exempt = row.exemptRoleId ? `<@&${row.exemptRoleId}>` : 'fara';
        return `<#${row.channelId}> - ${row.graceSeconds || 30}s - log: ${notice} - exceptie: ${exempt}`;
      }).join('\n')
      : 'Nu exista canale camera-only.';

    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x00d9ff).setTitle('BSH Camera Only').setDescription(description)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
