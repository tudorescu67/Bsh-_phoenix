/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Deschide un panou rapid pentru staff')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🛡️ Panou Staff Phoenix')
      .setDescription('Folosește butoanele de mai jos pentru a accesa rapid uneltele de staff.')
      .addFields(
        { name: '🛡️ Moderare', value: 'Deschide panelul de moderare pentru un membru.', inline: true },
        { name: '🎫 Suport', value: 'Deschide rapid un ticket pentru probleme sau solicitări.', inline: true }
      )
      .setFooter({ text: 'Phoenix Risen • Staff' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('mod_general_panel')
        .setLabel('Moderare')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket_open')
        .setLabel('Ticket suport')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  }
};
