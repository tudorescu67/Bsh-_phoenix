/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Trimite o sugestie pentru serverul Phoenix Risen')
    .addStringOption(o => o.setName('text').setDescription('Sugestia ta').setRequired(true)),

  async execute(interaction) {
    const text = interaction.options.getString('text');
    const guildId = interaction.guild.id;

    // Cautam canalul de sugestii configurat in baza de date
    const config = db.get('server_config', guildId) || {};
    const suggestChannelId = config.suggest_channel;

    if (!suggestChannelId) {
      return interaction.reply({ content: '❌ Canalul de sugestii nu este configurat! Un administrator trebuie să folosească `/set-suggest-channel`.', flags: MessageFlags.Ephemeral });
    }

    const channel = interaction.guild.channels.cache.get(suggestChannelId);
    if (!channel) return interaction.reply({ content: '❌ Canalul de sugestii nu mai există!', flags: MessageFlags.Ephemeral });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`💡 Sugestie Nouă`)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setDescription(text)
      .setTimestamp()
      .setFooter({ text: 'Votați folosind reacțiile de mai jos!' });

    const msg = await channel.send({ embeds: [embed] });
    await msg.react('✅');
    await msg.react('❌');

    await interaction.reply({ content: `✅ Sugestia ta a fost trimisă în <#${suggestChannelId}>!`, flags: MessageFlags.Ephemeral });
  }
};
