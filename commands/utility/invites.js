/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const inviteTracker = require('../../utils/inviteTracker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Sistem de management invitatii')
    .addSubcommand(s => s
      .setName('me')
      .setDescription('Vezi statisticile tale de invitatii')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul (implicit: tu)')))
    .addSubcommand(s => s
      .setName('top')
      .setDescription('Vezi topul invitatiilor de pe server')),
  cooldown: 5,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'me') {
      const user = interaction.options.getUser('utilizator') ?? interaction.user;
      const stats = inviteTracker.getInviteStats(interaction.guild.id, user.id);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`Invite-uri - ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Total', value: `${stats.invites || 0}`, inline: true },
          { name: 'Plecati', value: `${stats.left || 0}`, inline: true },
          { name: 'Fake', value: `${stats.fake || 0}`, inline: true },
          { name: 'Bonus', value: `${stats.bonus || 0}`, inline: true },
          { name: 'Real', value: `**${stats.real || 0}**`, inline: true },
        )
        .setFooter({ text: 'Phoenix Risen Tracker' });

      return interaction.reply({ embeds: [embed] });
    }

    const top = inviteTracker.getInviteTop(interaction.guild.id, 10);
    if (!top.length) {
      return interaction.reply({ content: 'Nu exista date pentru acest server.', flags: MessageFlags.Ephemeral });
    }

    const description = top.map((entry, index) => (
      `${index + 1}. <@${entry.userId}> - **${entry.real}** invitatii (${entry.invites || 0} total / ${entry.left || 0} plecat / ${entry.fake || 0} fake)`
    )).join('\n');

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle(`Top Invitatii - ${interaction.guild.name}`)
        .setDescription(description)
        .setFooter({ text: 'phoenixrisen.ro' })
        .setTimestamp()],
    });
  },

  ...inviteTracker,
};
