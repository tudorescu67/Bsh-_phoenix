/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Configurează sistemul de ticketing')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName('setup')
        .setDescription('Creează panoul de ticket cu categorii')
        .addChannelOption(o => o.setName('canal').setDescription('Canalul unde va fi panoul').setRequired(true))
        .addChannelOption(o => o.setName('categorie').setDescription('Categoria unde se vor deschide ticketele').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
        .addRoleOption(o => o.setName('staff').setDescription('Rolul care are acces la tickete').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const canal = interaction.options.getChannel('canal');
      const categorie = interaction.options.getChannel('categorie');
      const staffRole = interaction.options.getRole('staff');

      db.set('ticket_config', interaction.guild.id, {
        categoryId: categorie.id,
        staffRoleId: staffRole.id,
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎫 Suport & Tickete')
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setDescription(
          '**Bun venit la suport!**\n\n' +
          'Alege tipul de cerere din meniu si un ticket va fi deschis. Staff-ul nostru va raspunde cat mai curand posibil.\n\n' +
          '▎ *Nu deschide tickete inutile.*\n\n' +
          '📋 **Categorii disponibile**\n' +
          '🔧 **Suport General** — Ajutor si intrebari\n' +
          '🛡️ **Raport User** — Raporteaza un utilizator\n' +
          '💎 **VIP / Donatie** — Beneficii si achizitii\n' +
          '🐛 **Bug Report** — Raporteaza o problema\n' +
          '🤝 **Parteneriat** — Cereri de parteneriat'
        )
        .setFooter({ text: `${interaction.guild.name} • Suport 24/7` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket_select')
          .setPlaceholder('Selectează tipul de ticket...')
          .addOptions([
            { label: 'Suport General', value: 'gen', emoji: '🔧', description: 'Ajutor și întrebări generale' },
            { label: 'Raport User', value: 'report', emoji: '🛡️', description: 'Raportează un membru al serverului' },
            { label: 'VIP / Donație', value: 'vip', emoji: '💎', description: 'Probleme legate de donații sau VIP' },
            { label: 'Bug Report', value: 'bug', emoji: '🐛', description: 'Raportează o problemă tehnică' },
            { label: 'Parteneriat', value: 'partner', emoji: '🤝', description: 'Cereri de colaborare/parteneriat' },
          ])
      );

      await canal.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Panoul de ticket a fost creat în ${canal}!`, flags: MessageFlags.Ephemeral });
    }
  },
};
