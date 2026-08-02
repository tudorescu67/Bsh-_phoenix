/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('selfroles')
    .setDescription('Configurează panoul de auto-roluri')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName('setup')
        .setDescription('Creează un panou de auto-roluri')
        .addChannelOption(o => o.setName('canal').setDescription('Canalul unde va fi panoul').setRequired(true))
        .addStringOption(o => o.setName('titlu').setDescription('Titlul panoului').setRequired(true))
        .addStringOption(o => o.setName('descriere').setDescription('Descrierea panoului').setRequired(true))
        .addRoleOption(o => o.setName('rol1').setDescription('Primul rol').setRequired(true))
        .addRoleOption(o => o.setName('rol2').setDescription('Al doilea rol').setRequired(false))
        .addRoleOption(o => o.setName('rol3').setDescription('Al treilea rol').setRequired(false))
        .addRoleOption(o => o.setName('rol4').setDescription('Al patrulea rol').setRequired(false))
        .addRoleOption(o => o.setName('rol5').setDescription('Al cincilea rol').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const canal = interaction.options.getChannel('canal');
      const titlu = interaction.options.getString('titlu');
      const descriere = interaction.options.getString('descriere');
      
      const roles = [];
      for (let i = 1; i <= 5; i++) {
        const role = interaction.options.getRole(`rol${i}`);
        if (role) roles.push({ label: role.name, value: role.id });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(titlu)
        .setDescription(descriere)
        .setFooter({ text: 'Auto-Roles System' });

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('selfrole_select')
          .setPlaceholder('Alege un rol...')
          .setMinValues(0)
          .setMaxValues(roles.length)
          .addOptions(roles)
      );

      db.set('selfroles_config', interaction.guild.id, {
        guildId: interaction.guild.id,
        channelId: canal.id,
        title: titlu,
        description: descriere,
        roles,
        updatedAt: new Date().toISOString(),
        updatedBy: interaction.user.tag,
      });

      await canal.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Panoul de auto-roluri a fost creat în ${canal}!`, flags: MessageFlags.Ephemeral });
    }
  },

  async handleSelfRole(interaction) {
    const roles = interaction.values;
    const member = interaction.member;

    // Get all possible roles from the select menu to know what to remove
    const allRoles = interaction.component.options.map(o => o.value);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      // Remove roles not selected
      const rolesToRemove = allRoles.filter(id => !roles.includes(id));
      for (const roleId of rolesToRemove) {
        if (member.roles.cache.has(roleId)) await member.roles.remove(roleId);
      }

      // Add roles selected
      for (const roleId of roles) {
        if (!member.roles.cache.has(roleId)) await member.roles.add(roleId);
      }

      await interaction.editReply({ content: '✅ Rolurile tale au fost actualizate!' });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: '❌ A apărut o eroare la actualizarea rolurilor. Verifică permisiunile botului!' });
    }
  }
};
