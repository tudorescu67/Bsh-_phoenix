/* by Capitanul burcea,alex */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  category: 'community',
  data: new SlashCommandBuilder()
    .setName('community-feedback')
    .setDescription('Trimite feedback rapid pentru comunitate')
    .addIntegerOption(option => option.setName('rating').setDescription('Rating 1-10').setRequired(true).setMinValue(1).setMaxValue(10))
    .addStringOption(option => option.setName('text').setDescription('Feedback').setRequired(true).setMaxLength(500)),
  cooldown: 5,
  async execute(interaction) {
    const rating = interaction.options.getInteger('rating', true);
    const text = interaction.options.getString('text', true).trim();

    const feedback = db.getAll('community_feedback') || {};
    const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    feedback[id] = {
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      rating,
      text,
      createdAt: Date.now(),
    };
    db.save('community_feedback', feedback);

    return interaction.reply({ content: `Feedback salvat cu ID ${id}.`, flags: MessageFlags.Ephemeral });
  },
};
