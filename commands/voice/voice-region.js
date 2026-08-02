/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('voice-region')
    .setDescription('Seteaza regiunea RTC pe canalul voice curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(option =>
      option.setName('region')
        .setDescription('Regiunea voice')
        .setRequired(true)
        .addChoices(
          { name: 'Auto', value: 'auto' },
          { name: 'Europe', value: 'europe' },
          { name: 'US East', value: 'us-east' },
          { name: 'US West', value: 'us-west' }
        )
    ),
  cooldown: 3,
  async execute(interaction) {
    const channel = interaction.member?.voice?.channel;
    const region = interaction.options.getString('region', true);

    if (!channel) {
      return interaction.reply({ content: 'Trebuie sa fii intr-un canal voice.', flags: MessageFlags.Ephemeral });
    }

    await channel.setRTCRegion(region === 'auto' ? null : region, `voice-region by ${interaction.user.tag}`);
    return interaction.reply({ content: `Regiunea RTC a fost setata pe ${region}.` });
  },
};
