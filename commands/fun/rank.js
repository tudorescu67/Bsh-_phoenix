/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Vezi nivelul tău sau al altui utilizator pe Phoenix Risen')
    .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul (implicit: tu)')),

  async execute(interaction) {
    const user = interaction.options.getUser('utilizator') ?? interaction.user;
    const guildId = interaction.guild.id;
    const key = `${guildId}_${user.id}`;

    const data = db.get('levels', key) || { xp: 0, level: 0 };
    const nextLevelXP = (data.level + 1) * 500;
    const progress = Math.floor((data.xp / nextLevelXP) * 100);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 Rank — ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Nivel', value: `**${data.level}**`, inline: true },
        { name: 'XP', value: `**${data.xp}** / ${nextLevelXP}`, inline: true },
        { name: 'Progres', value: `**${progress}%** până la nivelul următor`, inline: true }
      )
      .setFooter({ text: 'phoenixrisen.ro • Sistem de Nivel' });

    await interaction.reply({ embeds: [embed] });
  }
};
