/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Blocheaza sau deblocheaza un canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub => sub.setName('on').setDescription('Blocheaza canalul curent')
      .addStringOption(o => o.setName('motiv').setDescription('Motivul').setRequired(false)))
    .addSubcommand(sub => sub.setName('off').setDescription('Deblocheaza canalul curent')
      .addStringOption(o => o.setName('motiv').setDescription('Motivul').setRequired(false))),
  cooldown: 5,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const motiv = interaction.options.getString('motiv') ?? 'Fara motiv specificat';
    const channel = interaction.channel;
    const everyoneRole = interaction.guild.roles.everyone;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      if (sub === 'on') {
        await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false });
        await interaction.editReply({ embeds: [successEmbed(`🔒 Canalul **${channel.name}** a fost blocat.\n**Motiv:** ${motiv}`)] });
        await sendLog(interaction.guild, 'lock', { moderator: interaction.user, channel, reason: motiv });
      } else {
        await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: null });
        await interaction.editReply({ embeds: [successEmbed(`🔓 Canalul **${channel.name}** a fost deblocat.\n**Motiv:** ${motiv}`)] });
        await sendLog(interaction.guild, 'unlock', { moderator: interaction.user, channel, reason: motiv });
      }
    } catch {
      await interaction.editReply({ embeds: [errorEmbed('Nu am putut modifica canalul.')] });
    }
  },
};
