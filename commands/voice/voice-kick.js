/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('voice-kick')
    .setDescription('Scoate un utilizator din voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
    .addUserOption(option => option.setName('user').setDescription('Utilizatorul').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Motiv').setRequired(false).setMaxLength(150)),
  cooldown: 3,
  async execute(interaction) {
    const member = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || `voice-kick by ${interaction.user.tag}`;

    if (!member?.voice?.channel) {
      return interaction.reply({ content: 'Utilizatorul nu este intr-un canal voice.', flags: MessageFlags.Ephemeral });
    }

    await member.voice.disconnect(reason);
    return interaction.reply({ content: `${member} a fost scos din voice.` });
  },
};
