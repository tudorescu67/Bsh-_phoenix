/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('voice-rename')
    .setDescription('Redenumeste canalul voice curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(option => option.setName('name').setDescription('Noul nume').setRequired(true).setMaxLength(60)),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.member?.voice?.channel;
    if (!channel) {
      return interaction.reply({ content: 'Trebuie sa fii intr-un canal voice.', flags: MessageFlags.Ephemeral });
    }

    const name = interaction.options.getString('name', true);
    await channel.setName(name, `voice-rename by ${interaction.user.tag}`);
    return interaction.reply({ content: `Canalul a fost redenumit in ${name}.` });
  },
};
