/* by Capitanul burcea,alex */
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Seteaza un reminder simplu')
    .addIntegerOption(option =>
      option
        .setName('minute')
        .setDescription('In cate minute sa te anunt')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1440)
    )
    .addStringOption(option =>
      option
        .setName('text')
        .setDescription('Ce sa iti reamintesc')
        .setRequired(true)
        .setMaxLength(500)
    ),

  async execute(interaction) {
    const minutes = interaction.options.getInteger('minute', true);
    const text = interaction.options.getString('text', true);
    const channel = interaction.channel;
    const userId = interaction.user.id;

    setTimeout(() => {
      channel?.send?.(`<@${userId}> reminder: ${text}`).catch(() => {});
    }, minutes * 60_000);

    return interaction.reply({ content: `Reminder setat pentru ${minutes} minute.`, ephemeral: true });
  },
};
