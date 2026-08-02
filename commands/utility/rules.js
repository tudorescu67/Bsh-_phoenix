/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-rules')
    .setDescription('Configurează mesajul de regulament')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(o => o.setName('rol').setDescription('Rolul acordat la acceptare').setRequired(true)),
  
  async execute(interaction) {
    const role = interaction.options.getRole('rol');
    
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📜 Regulament Phoenix Risen')
      .setDescription(`Bun venit pe serverul nostru! Te rugăm să citești și să accepți regulamentul pentru a avea acces la restul canalelor.\n\n` +
        `1. Respectă toți membrii comunității.\n` +
        `2. Fără spam, flood sau CAPS LOCK excesiv.\n` +
        `3. Fără conținut obscen, rasist sau jignitor.\n` +
        `4. Reclama de orice fel este strict interzisă.\n\n` +
        `Apasă butonul de mai jos pentru a accepta regulile!`)
      .setFooter({ text: 'phoenixrisen.ro' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rules_accept_${role.id}`)
        .setLabel('Accept Regulamentul')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Mesajul de regulament a fost trimis!', flags: MessageFlags.Ephemeral });
  }
};
