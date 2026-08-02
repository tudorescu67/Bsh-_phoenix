/* by Capitanul burcea,alex */
const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Trimite un embed custom')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption(o => o.setName('canal').setDescription('Canalul tinta (implicit: curent)').setRequired(false).addChannelTypes(ChannelType.GuildText)),
  cooldown: 5,
  async execute(interaction) {
    const modal = new ModalBuilder().setCustomId('embed_builder_modal').setTitle('📝 Creeaza Embed');
    modal.addComponents(
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('titlu').setLabel('Titlu').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(256)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('descriere').setLabel('Descriere').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('culoare').setLabel('Culoare hex (ex: #5865F2)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(7).setPlaceholder('#5865F2')),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('imagine').setLabel('URL Imagine (optional)').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('footer').setLabel('Footer text (optional)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(2048)),
    );
    // Salveaza canalul tinta temporar in customId
    const ch = interaction.options.getChannel('canal');
    if (ch) modal.setCustomId(`embed_builder_modal_${ch.id}`);
    await interaction.showModal(modal);
  },
};

module.exports.handleEmbedModal = async (interaction) => {
  if (!interaction.isModalSubmit() || !interaction.customId.startsWith('embed_builder_modal')) return;
  const parts = interaction.customId.split('_');
  const targetChannelId = parts[3] ?? null;
  const canal = targetChannelId ? interaction.guild.channels.cache.get(targetChannelId) : interaction.channel;

  const titlu    = interaction.fields.getTextInputValue('titlu');
  const descriere= interaction.fields.getTextInputValue('descriere');
  const culoare  = interaction.fields.getTextInputValue('culoare') || '#5865F2';
  const imagine  = interaction.fields.getTextInputValue('imagine');
  const footer   = interaction.fields.getTextInputValue('footer');

  let color;
  try { color = parseInt(culoare.replace('#',''), 16); } catch { color = 0x5865f2; }

  const embed = new EmbedBuilder().setColor(color).setDescription(descriere).setTimestamp();
  if (titlu) embed.setTitle(titlu);
  if (footer) embed.setFooter({ text: footer });
  if (imagine) embed.setImage(imagine).catch(() => {});

  await canal.send({ embeds: [embed] });
  await interaction.reply({ content: `✅ Embed trimis in ${canal}!`, flags: MessageFlags.Ephemeral });
};
