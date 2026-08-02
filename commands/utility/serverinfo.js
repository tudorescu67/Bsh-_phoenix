/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('Informatii despre server'),
  cooldown: 5,
  async execute(interaction) {
    const g = interaction.guild;
    await g.members.fetch().catch(() => {});
    const bots  = g.members.cache.filter(m => m.user.bot).size;
    const humans = g.memberCount - bots;
    const online = g.members.cache.filter(m => m.presence?.status !== 'offline' && m.presence?.status).size;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${g.name}`)
      .setThumbnail(g.iconURL({ dynamic: true }))
      .addFields(
        { name: '👑 Owner', value: `<@${g.ownerId}>`, inline: true },
        { name: '📅 Creat', value: `<t:${Math.floor(g.createdTimestamp/1000)}:D>`, inline: true },
        { name: '🌍 Regiune', value: g.preferredLocale || 'N/A', inline: true },
        { name: '👥 Membri', value: `${g.memberCount} total\n👤 ${humans} | 🤖 ${bots}`, inline: true },
        { name: '💬 Canale', value: `${g.channels.cache.size}`, inline: true },
        { name: '🎭 Roluri', value: `${g.roles.cache.size}`, inline: true },
        { name: '😀 Emojis', value: `${g.emojis.cache.size}`, inline: true },
        { name: '🔒 Verificare', value: `${g.verificationLevel}`, inline: true },
        { name: '💎 Boost', value: `Nivel ${g.premiumTier}\n${g.premiumSubscriptionCount} boosturi`, inline: true },
      )
      .setImage(g.bannerURL({ size: 1024 }))
      .setFooter({ text: `ID: ${g.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
