/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Configurează sistemul de canale vocale temporare')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName('setup')
        .setDescription('Setează canalul principal pentru creare VC')
        .addChannelOption(o => o.setName('canal').setDescription('Canalul vocal principal').addChannelTypes(ChannelType.GuildVoice).setRequired(true))
        .addChannelOption(o => o.setName('categorie').setDescription('Categoria unde se creează canalele').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const canal = interaction.options.getChannel('canal');
      const categorie = interaction.options.getChannel('categorie');

      db.set('voice_config', interaction.guild.id, {
        creatorChannelId: canal.id,
        categoryId: categorie.id,
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🔊 Sistem Voice Temporar')
        .setDescription(`Sistemul a fost configurat cu succes!\n\n**Canal Creator:** ${canal}\n**Categorie:** ${categorie.name}`)
        .setFooter({ text: 'phoenixrisen.ro • Voice System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
