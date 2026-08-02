/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const mm = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Opreste muzica si golete coada'),
  cooldown: 2,
  async execute(interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: '❌ Trebuie sa fii in VC!', flags: MessageFlags.Ephemeral });
    mm.destroy(interaction.guild.id);
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xed4245).setDescription('⏹️ Muzica oprita. Coada golita.')] });
  },
};
