/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Informatii despre un utilizator')
    .addUserOption(o =>
      o.setName('utilizator').setDescription('Utilizatorul (implicit: tu)').setRequired(false)
    ),

  cooldown: 5,

  async execute(interaction) {
    const user = interaction.options.getUser('utilizator') ?? interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const roles = member?.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => r.toString())
      .slice(0, 10)
      .join(' ') || 'Niciun rol';

    const embed = new EmbedBuilder()
      .setColor(member?.displayColor || 0x5865f2)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '🤖 Bot', value: user.bot ? 'Da' : 'Nu', inline: true },
        { name: '📅 Cont creat', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        ...(member
          ? [
              { name: '📥 Intrat pe server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
              { name: '🎭 Nick', value: member.nickname || 'Fara nick', inline: true },
              { name: `🏷️ Roluri (${member.roles.cache.size - 1})`, value: roles, inline: false },
            ]
          : [])
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
