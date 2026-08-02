/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

function linkLine(label, value) {
  return value ? `**${label}:** ${value}` : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sustinere')
    .setDescription('Donatii, investitii si social media BSH')
    .addStringOption((option) => option
      .setName('tip')
      .setDescription('Ce vrei sa vezi?')
      .setRequired(false)
      .addChoices(
        { name: 'Donatii', value: 'donatii' },
        { name: 'Investitii', value: 'investitii' },
        { name: 'Social Media', value: 'social' },
      )),

  async execute(interaction) {
    const tip = interaction.options.getString('tip') || 'donatii';
    const lines = [
      tip !== 'investitii' && linkLine('Donatii', process.env.BSH_DONATE_URL || process.env.BSH_BILLING_CHECKOUT_URL),
      tip !== 'donatii' && linkLine('Investitii', process.env.BSH_INVEST_URL || process.env.BSH_BILLING_CHECKOUT_URL),
      linkLine('Site', process.env.BSH_PUBLIC_URL || 'https://bsh.net'),
      linkLine('Panel', process.env.BSH_PANEL_URL || 'https://panel.bsh.net'),
      linkLine('Instagram', process.env.BSH_SOCIAL_INSTAGRAM),
      linkLine('WhatsApp', process.env.BSH_SOCIAL_WHATSAPP),
      linkLine('YouTube', process.env.BSH_SOCIAL_YOUTUBE),
      linkLine('TikTok', process.env.BSH_SOCIAL_TIKTOK),
    ].filter(Boolean);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xD4AF37)
          .setTitle('BSH - Sustinere si Social')
          .setDescription(lines.join('\n') || 'Configureaza linkurile in .env pentru donatii, investitii si social media.')
          .setFooter({ text: 'Platile reale se confirma doar prin site/provider securizat.' }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
