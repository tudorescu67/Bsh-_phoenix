/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Afiseaza avatarul unui utilizator')
    .addUserOption(o =>
      o.setName('utilizator').setDescription('Utilizatorul (implicit: tu)').setRequired(false)
    ),
  cooldown: 3,
  async execute(interaction) {
    const user = interaction.options.getUser('utilizator') ?? interaction.user;
    const formats = ['webp', 'png', 'jpg'];
    const links = formats.map(f => `[${f.toUpperCase()}](${user.displayAvatarURL({ extension: f, size: 1024 })})`).join(' • ');
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🖼️ Avatar — ${user.tag}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setDescription(links);
    await interaction.reply({ embeds: [embed] });
  },
};
