/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('voice-unlock')
    .setDescription('Deblocheaza accesul in canalul voice curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.member?.voice?.channel;
    if (!channel) {
      return interaction.reply({ content: 'Intra intr-un canal voice mai intai.', flags: MessageFlags.Ephemeral });
    }

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { Connect: null }, { reason: `voice-unlock by ${interaction.user.tag}` });
    return interaction.reply({ content: `Canalul ${channel} a fost deblocat.` });
  },
};
