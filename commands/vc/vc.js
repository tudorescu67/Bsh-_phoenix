/* by Capitanul burcea,alex */
/**
 * /vc setup  — Creeaza panoul de creare canale vocale temporare
 *
 * Flow:
 *  1. Admin ruleaza /vc setup  → se creeaza un canal vocal "➕ Creeaza Canal"
 *  2. Userul intra in acel canal → botul ii creeaza automat un VC privat
 *  3. Ownerul VC-ului are un panou text cu butoane de control
 *  4. Cand toti parasesc VC-ul → se sterge automat
 */
const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags,
} = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vc')
    .setDescription('Sistem canale vocale temporare')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName('setup')
      .setDescription('Configureaza sistemul de VC-uri temporare')
      .addChannelOption(o => o.setName('categorie')
        .setDescription('Categoria unde se creeaza VC-urile')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory))
      .addStringOption(o => o.setName('nume_canal')
        .setDescription('Numele canalului de creare (default: ➕ Creeaza Canal)')
        .setRequired(false))
      .addIntegerOption(o => o.setName('limita_default')
        .setDescription('Limita default de useri (0 = nelimitat)')
        .setMinValue(0).setMaxValue(99).setRequired(false))
      .addStringOption(o => o.setName('format_nume')
        .setDescription('Formatul numelui VC (variabile: {user} {count}). Ex: 🎮 {user}')
        .setRequired(false))
    )
    .addSubcommand(s => s.setName('panel')
      .setDescription('Trimite panoul de control VC intr-un canal text')
      .addChannelOption(o => o.setName('canal')
        .setDescription('Canalul text pentru panou')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(s => s.setName('info')
      .setDescription('Afiseaza configuratia curenta')
    )
    .addSubcommand(s => s.setName('disable')
      .setDescription('Dezactiveaza sistemul de VC-uri temporare')
    ),

  cooldown: 5,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // ── SETUP ──────────────────────────────────────────────────────────────────
    if (sub === 'setup') {
      const categorie    = interaction.options.getChannel('categorie');
      const numeCanalRaw = interaction.options.getString('nume_canal')    ?? '➕ Creeaza Canal';
      const limitaDefault= interaction.options.getInteger('limita_default') ?? 0;
      const formatNume   = interaction.options.getString('format_nume')   ?? '🎙️ {user}';

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Creeaza canalul "trigger" de join
      const triggerChannel = await interaction.guild.channels.create({
        name: numeCanalRaw,
        type: ChannelType.GuildVoice,
        parent: categorie.id,
        userLimit: 0,
        permissionOverwrites: [
          { id: interaction.guild.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel] },
          { id: interaction.client.user.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers] },
        ],
      });

      db.set('vc_config', guildId, {
        triggerChannelId: triggerChannel.id,
        categoryId:       categorie.id,
        limitaDefault,
        formatNume,
        activeVCs:        {},
      });

      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle('✅ Sistem VC configurat!')
          .setDescription(`Canalul **${triggerChannel.name}** a fost creat in **${categorie.name}**.\n\nUserii care intra in el vor primi automat propriul canal vocal!`)
          .addFields(
            { name: '📁 Categorie',      value: categorie.name,              inline: true },
            { name: '👥 Limita default', value: limitaDefault ? `${limitaDefault} useri` : 'Nelimitat', inline: true },
            { name: '📝 Format nume',    value: `\`${formatNume}\``,        inline: true },
          )
        ],
      });
    }

    // ── PANEL ──────────────────────────────────────────────────────────────────
    if (sub === 'panel') {
      const canal = interaction.options.getChannel('canal');
      const cfg   = db.get('vc_config', guildId);
      if (!cfg) return interaction.reply({ content: '❌ Ruleaza mai intai `/vc setup`.', flags: MessageFlags.Ephemeral });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🎙️ Control Canal Vocal')
        .setDescription('Foloseste butoanele de mai jos pentru a-ti gestiona canalul vocal temporar.\n\n> **Trebuie sa fii owner-ul canalului** pentru a putea folosi comenzile.')
        .addFields(
          { name: '🔒 Blocheaza / 🔓 Deblocheaza', value: 'Opreste sau permite joinul altor useri', inline: false },
          { name: '✏️ Redenumeste',                value: 'Schimba numele canalului tau',            inline: false },
          { name: '👥 Limita',                     value: 'Seteaza numarul maxim de useri',         inline: false },
          { name: '👑 Transfer',                   value: 'Da ownership altui user',                inline: false },
          { name: '🚫 Kick / ✅ Permit',           value: 'Gestioneaza accesul userilor',           inline: false },
          { name: '🔇 Mute / 🔊 Unmute',           value: 'Muteaza/Unmuteaza un user in VC',        inline: false },
          { name: '👻 Ascunde / 👁️ Vizibil',      value: 'Controleaza vizibilitatea canalului',    inline: false },
          { name: '🗑️ Sterge',                     value: 'Sterge canalul tau',                    inline: false },
        )
        .setFooter({ text: `${interaction.guild.name} • VC System` })
        .setTimestamp();

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vc_lock').setLabel('Blocheaza').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vc_unlock').setLabel('Deblocheaza').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vc_rename').setLabel('Redenumeste').setEmoji('✏️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('vc_limit').setLabel('Limita').setEmoji('👥').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('vc_delete').setLabel('Sterge').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vc_hide').setLabel('Ascunde').setEmoji('👻').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vc_show').setLabel('Vizibil').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vc_transfer').setLabel('Transfer Owner').setEmoji('👑').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('vc_kick').setLabel('Kick User').setEmoji('🚫').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('vc_permit').setLabel('Permit User').setEmoji('✅').setStyle(ButtonStyle.Success),
      );
      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vc_mute').setLabel('Mute VC').setEmoji('🔇').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('vc_unmute').setLabel('Unmute VC').setEmoji('🔊').setStyle(ButtonStyle.Success),
      );

      await canal.send({ embeds: [embed], components: [row1, row2, row3] });
      await interaction.reply({ content: `✅ Panoul de control VC trimis in ${canal}!`, flags: MessageFlags.Ephemeral });
    }

    // ── INFO ───────────────────────────────────────────────────────────────────
    if (sub === 'info') {
      const cfg = db.get('vc_config', guildId);
      if (!cfg) return interaction.reply({ content: '❌ Sistemul VC nu este configurat.', flags: MessageFlags.Ephemeral });
      const active = Object.keys(cfg.activeVCs ?? {}).length;
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('🎙️ Config VC')
          .addFields(
            { name: 'Canal trigger',    value: `<#${cfg.triggerChannelId}>`, inline: true },
            { name: 'Categorie',        value: `<#${cfg.categoryId}>`,       inline: true },
            { name: 'Limita default',   value: cfg.limitaDefault ? `${cfg.limitaDefault}` : 'Nelimitat', inline: true },
            { name: 'Format nume',      value: `\`${cfg.formatNume}\``,     inline: true },
            { name: 'VC-uri active',    value: `${active}`,                  inline: true },
          )
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // ── DISABLE ────────────────────────────────────────────────────────────────
    if (sub === 'disable') {
      const cfg = db.get('vc_config', guildId);
      if (cfg?.triggerChannelId) {
        const ch = interaction.guild.channels.cache.get(cfg.triggerChannelId);
        await ch?.delete().catch(() => {});
      }
      db.del('vc_config', guildId);
      await interaction.reply({ content: '✅ Sistemul VC dezactivat.', flags: MessageFlags.Ephemeral });
    }
  },
};
