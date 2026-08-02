/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-suggest-channel')
    .setDescription('Configurează canalul unde vor fi trimise sugestiile')
    .addChannelOption(o => o.setName('canal').setDescription('Canalul de sugestii').setRequired(true).addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal');
    const guildId = interaction.guild.id;

    let config = db.get('server_config', guildId) || {};
    config.suggest_channel = channel.id;
    db.set('server_config', guildId, config);

    await interaction.reply({ content: `✅ Canalul de sugestii a fost setat pe ${channel}!`, flags: MessageFlags.Ephemeral });
  }
};
