/* by Capitanul burcea,alex */
const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType,
  ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags,
} = require('discord.js');
const db = require('../../utils/database');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Sistem de verificare membrii')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName('setup')
      .setDescription('Creeaza panoul de verificare')
      .addChannelOption(o => o.setName('canal').setDescription('Canalul').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addRoleOption(o => o.setName('rol').setDescription('Rolul primit la verificare').setRequired(true))
      .addRoleOption(o => o.setName('rol_neverificat').setDescription('Rolul de eliminat la verificare').setRequired(false))
      .addStringOption(o => o.setName('tip').setDescription('Tipul de verificare').addChoices(
        { name: 'Simplu (un click)', value: 'simple' },
        { name: 'Buton + confirmare', value: 'confirm' },
        { name: 'CAPTCHA (Cod de securitate)', value: 'captcha' },
        { name: 'Reacție (Emoji)', value: 'reaction' },
      ).setRequired(false))
      .addStringOption(o => o.setName('mesaj').setDescription('Mesajul custom').setRequired(false))
      .addStringOption(o => o.setName('imagine').setDescription('URL imagine de fundal/banner pentru panou').setRequired(false))
    )
    .addSubcommand(s => s.setName('stats')
      .setDescription('Statistici verificari')
    ),
  cooldown: 5,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const canal      = interaction.options.getChannel('canal');
      const rol        = interaction.options.getRole('rol');
      const rolRemove  = interaction.options.getRole('rol_neverificat');
      const tip        = interaction.options.getString('tip') ?? 'simple';
      const imagine    = interaction.options.getString('imagine');
      const mesaj      = interaction.options.getString('mesaj') ??
        (tip === 'reaction' 
          ? 'Reacționează cu ✅ la acest mesaj pentru a te verifica și a accesa serverul!'
          : 'Apasă butonul de mai jos pentru a te verifica și a accesa serverul complet!');

      db.set('verify_config', interaction.guild.id, {
        roleId: rol.id,
        removeRoleId: rolRemove?.id ?? null,
        count: 0,
        tip: tip,
      });

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('✅ Verificare Membri')
        .setDescription(mesaj)
        .addFields(
          { name: '🏆 Rol primit', value: `${rol}`, inline: true },
          { name: '🔐 Tip verificare', value: tip.charAt(0).toUpperCase() + tip.slice(1), inline: true },
        )
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setFooter({ text: `${interaction.guild.name} • Phoenix Risen Security` })
        .setTimestamp();

      if (imagine) embed.setImage(imagine);

      if (tip === 'reaction') {
        const sentMessage = await canal.send({ embeds: [embed] });
        await sentMessage.react('✅');
        
        // Salvăm ID-ul mesajului pentru a-l identifica în event
        const cfg = db.get('verify_config', interaction.guild.id);
        cfg.messageId = sentMessage.id;
        db.set('verify_config', interaction.guild.id, cfg);
      } else {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`verify_${tip}_${rol.id}_${rolRemove?.id ?? 'none'}`)
            .setLabel('✅ Verifică-mă!')
            .setStyle(ButtonStyle.Success),
        );
        await canal.send({ embeds: [embed], components: [row] });
      }

      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`✅ Panoul de verificare creat în ${canal}!\nTip: **${tip}**\nImagine: ${imagine ? '✅ Setată' : '❌ Nesetată'}`)], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'stats') {
      const cfg = db.get('verify_config', interaction.guild.id);
      if (!cfg) return interaction.reply({ content: '❌ Verificarea nu este configurata.', flags: MessageFlags.Ephemeral });
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle('📊 Statistici Verificare')
        .addFields(
          { name: '✅ Total verificati', value: `${cfg.count ?? 0}`, inline: true },
          { name: '🏆 Rol', value: `<@&${cfg.roleId}>`, inline: true },
        )], flags: MessageFlags.Ephemeral });
    }
  },
};

module.exports.handleVerify = async (interaction) => {
  if (!interaction.isButton() || !interaction.customId.startsWith('verify_')) return;
  const parts = interaction.customId.split('_');
  const tip        = parts[1];
  const roleId     = parts[2];
  const removeId   = parts[3];
  const member     = interaction.member;
  const guild      = interaction.guild;

  if (member.roles.cache.has(roleId)) {
    return interaction.reply({ content: '✅ Esti deja verificat!', flags: MessageFlags.Ephemeral });
  }

  if (tip === 'captcha') {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    db.set('captcha', interaction.user.id, code);

    const modal = new ModalBuilder()
      .setCustomId(`verify_modal_${roleId}_${removeId}`)
      .setTitle('🛡️ Verificare Securitate');

    const input = new TextInputBuilder()
      .setCustomId('captcha_input')
      .setLabel(`Introdu codul: ${code}`)
      .setPlaceholder('Scrie codul de mai sus aici...')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  if (tip === 'confirm') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`verify_simple_${roleId}_${removeId}`).setLabel('Da, confirma verificarea!').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('verify_cancel').setLabel('Anuleaza').setStyle(ButtonStyle.Secondary),
    );
    return interaction.reply({ content: '❓ Esti sigur ca vrei sa te verifici?', components: [row], flags: MessageFlags.Ephemeral });
  }

  if (interaction.customId === 'verify_cancel') {
    return interaction.update({ content: '❌ Verificare anulata.', components: [] });
  }

  // Simple or Final Step
  await completeVerification(interaction, roleId, removeId);
};

module.exports.handleVerifyModal = async (interaction) => {
  if (!interaction.isModalSubmit() || !interaction.customId.startsWith('verify_modal_')) return;
  
  const parts = interaction.customId.split('_');
  const roleId = parts[2];
  const removeId = parts[3];
  const input = interaction.fields.getTextInputValue('captcha_input');
  const expected = db.get('captcha', interaction.user.id);

  if (input.toUpperCase() !== expected) {
    return interaction.reply({ content: '❌ Cod incorect! Te rugam sa mai incerci o data.', flags: MessageFlags.Ephemeral });
  }

  db.del('captcha', interaction.user.id);
  await completeVerification(interaction, roleId, removeId, true);
};

async function completeVerification(interaction, roleId, removeId, isModal = false) {
  const member = interaction.member;
  const guild = interaction.guild;

  try {
    await member.roles.add(roleId);
    if (removeId !== 'none') await member.roles.remove(removeId).catch(() => {});

    const cfg = db.get('verify_config', guild.id) ?? {};
    cfg.count = (cfg.count ?? 0) + 1;
    db.set('verify_config', guild.id, cfg);

    const msg = `✅ Verificat! Bun venit pe **${guild.name}**!`;
    if (isModal) {
      await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
    } else {
      if (interaction.replied || interaction.deferred) await interaction.editReply({ content: msg, components: [] });
      else await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
    }
  } catch (err) {
    console.error('[Verify error]', err);
    const errMsg = '❌ Nu am putut adauga rolul. Verifica permisiunile botului.';
    if (interaction.replied || interaction.deferred) await interaction.followUp({ content: errMsg, flags: MessageFlags.Ephemeral });
    else await interaction.reply({ content: errMsg, flags: MessageFlags.Ephemeral });
  }
}
