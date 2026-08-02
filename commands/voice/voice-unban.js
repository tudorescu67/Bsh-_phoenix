/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('voice-unban')
    .setDescription('Deblocheaza accesul unui user pe canalul tau voice')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true)),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.member?.voice?.channel;
    const user = interaction.options.getUser('user', true);

    if (!channel) {
      return interaction.reply({ content: 'Trebuie sa fii intr-un canal voice.', flags: MessageFlags.Ephemeral });
    }

    await channel.permissionOverwrites.edit(user.id, { Connect: null }, { reason: `voice-unban by ${interaction.user.tag}` });
    return interaction.reply({ content: `<@${user.id}> poate intra din nou in ${channel}.` });
  },
};
