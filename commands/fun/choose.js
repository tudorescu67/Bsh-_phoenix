/* by Capitanul burcea,alex */
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('choose')
    .setDescription('Alege rapid una dintre optiuni')
    .addStringOption(option =>
      option
        .setName('optiuni')
        .setDescription('Optiuni separate prin virgula')
        .setRequired(true)
        .setMaxLength(1000)
    ),

  async execute(interaction) {
    const choices = interaction.options.getString('optiuni', true)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 25);

    if (choices.length < 2) {
      return interaction.reply({ content: 'Da-mi cel putin doua optiuni separate prin virgula.', ephemeral: true });
    }

    const pick = choices[Math.floor(Math.random() * choices.length)];
    return interaction.reply(`Aleg: **${pick}**`);
  },
};
