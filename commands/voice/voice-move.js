/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('voice-move')
    .setDescription('Muta un utilizator in canalul voice in care esti')
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
    .addUserOption(option => option.setName('user').setDescription('Utilizator').setRequired(true)),
  cooldown: 3,
  async execute(interaction) {
    const destination = interaction.member?.voice?.channel;
    const target = interaction.options.getMember('user');

    if (!destination) {
      return interaction.reply({ content: 'Trebuie sa fii intr-un canal voice.', flags: MessageFlags.Ephemeral });
    }
    if (!target?.voice?.channel) {
      return interaction.reply({ content: 'Utilizatorul tinta nu este in voice.', flags: MessageFlags.Ephemeral });
    }

    await target.voice.setChannel(destination, `voice-move by ${interaction.user.tag}`);
    return interaction.reply({ content: `${target} a fost mutat in ${destination}.` });
  },
};
