/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getInviteTop } = require('../../utils/inviteTracker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite-leaderboard')
    .setDescription('Vezi cine are cele mai multe invitatii pe server'),

  async execute(interaction) {
    const top = getInviteTop(interaction.guild.id, 10);
    if (!top.length) {
      return interaction.reply({ content: 'Nu exista date despre invitatii momentan.', flags: MessageFlags.Ephemeral });
    }

    const description = top.map((entry, index) => (
      `**${index + 1}.** <@${entry.userId}> - **${entry.real}** reali (${entry.invites || 0} total / ${entry.left || 0} plecati / ${entry.fake || 0} fake)`
    )).join('\n');

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Top Invitatii Phoenix Risen')
        .setDescription(description)
        .setFooter({ text: 'phoenixrisen.ro' })
        .setTimestamp()],
    });
  },
};
