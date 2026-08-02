/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-stats')
    .setDescription('Configurează canalele de statistici server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const guild = interaction.guild;

    try {
      // 1. Creeaza Categoria
      const category = await guild.channels.create({
        name: '📊 STATISTICI SERVER',
        type: ChannelType.GuildCategory,
      });

      // 2. Creeaza Canalele (Voice pentru a fi read-only si a arata bine)
      const totalMembers = await guild.channels.create({
        name: `Membri: ${guild.memberCount}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.Connect] }
        ]
      });

      const bots = await guild.channels.create({
        name: `Boti: ${guild.members.cache.filter(m => m.user.bot).size}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.Connect] }
        ]
      });

      const online = await guild.channels.create({
        name: `Online: ${guild.members.cache.filter(m => m.presence?.status === 'online' || m.presence?.status === 'dnd' || m.presence?.status === 'idle').size}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.Connect] }
        ]
      });

      // Salveaza in DB pentru update-uri periodice
      db.set('server_stats', guild.id, {
        categoryId: category.id,
        channels: {
          total: totalMembers.id,
          bots: bots.id,
          online: online.id
        }
      });

      await interaction.editReply({ content: '✅ Canalele de statistici au fost create cu succes!' });
    } catch (err) {
      console.error('[Stats Setup Error]', err);
      await interaction.editReply({ content: '❌ A apărut o eroare la crearea canalelor.' });
    }
  },
};
