/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Arunca o moneda'),
  cooldown: 2,
  async execute(interaction) {
    const result = Math.random() < 0.5 ? '🪙 CAP' : '🪙 PAJURA';
    const embed = new EmbedBuilder().setColor(0xfee75c).setTitle('Aruncare moneda').setDescription(`**${result}**`);
    await interaction.reply({ embeds: [embed] });
  },
};
