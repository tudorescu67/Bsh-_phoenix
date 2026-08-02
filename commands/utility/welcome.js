/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags, ChannelType } = require('discord.js');
const db = require('../../utils/database');

function cleanFrameColor(value) {
  if (!value) return null;
  const color = value.trim();
  return /^#?[0-9a-f]{6}$/i.test(color) ? (color.startsWith('#') ? color : `#${color}`) : null;
}

function defaultMessage() {
  return 'Welcome {user}! Bine ai venit pe **{server}**. Ai fost invitat de {inviter}. {inviter} are acum **{inviteCount}** invitatii reale.';
}

function parseFrameColor(value) {
  const clean = String(value || '#D4AF37').replace('#', '');
  return /^[0-9a-f]{6}$/i.test(clean) ? parseInt(clean, 16) : 0xD4AF37;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configureaza sistemul de bun venit')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName('setup')
        .setDescription('Seteaza canalul, mesajul, poza/GIF si rama')
        .addChannelOption(o => o.setName('canal').setDescription('Canalul de welcome').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption(o => o.setName('mesaj').setDescription('Text: {user} {server} {inviter} {inviteCount}').setRequired(false))
        .addRoleOption(o => o.setName('rol').setDescription('Rol acordat automat la intrare').setRequired(false))
        .addStringOption(o => o.setName('imagine').setDescription('URL poza/GIF/banner welcome, pus manual').setRequired(false))
        .addStringOption(o => o.setName('rama').setDescription('Culoare rama HEX, ex: #D4AF37').setRequired(false))
        .addBooleanOption(o => o.setName('card').setDescription('Porneste/opreste cardul generat cand canvas exista').setRequired(false))
    )
    .addSubcommand(s => s.setName('status').setDescription('Vezi configuratia actuala')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const canal = interaction.options.getChannel('canal');
      const mesaj = interaction.options.getString('mesaj') ?? defaultMessage();
      const rol = interaction.options.getRole('rol');
      const imagine = interaction.options.getString('imagine');
      const rama = cleanFrameColor(interaction.options.getString('rama'));
      const card = interaction.options.getBoolean('card');

      db.set('welcome_config', interaction.guild.id, {
        channelId: canal.id,
        message: mesaj,
        autoRoleId: rol?.id ?? null,
        image: imagine ?? null,
        frameColor: rama || '#D4AF37',
        card: card !== false,
      });

      return interaction.reply({
        content: `Welcome setat in ${canal}. Poza/GIF: ${imagine ? 'da' : 'nu'} | Rama: ${rama || '#D4AF37'} | Card: ${card === false ? 'oprit' : 'pornit'}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const config = db.get('welcome_config', interaction.guild.id);
    if (!config) {
      return interaction.reply({ content: 'Sistemul nu este configurat.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setColor(parseFrameColor(config.frameColor))
      .setTitle('Configuratie Welcome')
      .addFields(
        { name: 'Canal', value: `<#${config.channelId}>`, inline: true },
        { name: 'Auto-Rol', value: config.autoRoleId ? `<@&${config.autoRoleId}>` : 'Niciunul', inline: true },
        { name: 'Rama', value: config.frameColor || '#D4AF37', inline: true },
        { name: 'Card', value: config.card === false ? 'Oprit' : 'Pornit', inline: true },
        { name: 'Mesaj', value: `\`\`\`${config.message || defaultMessage()}\`\`\`` },
      );

    if (config.image) embed.setImage(config.image);
    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
