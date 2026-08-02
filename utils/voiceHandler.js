/* by Capitanul burcea,alex */
const { PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const db = require('./database');

async function handleInteraction(interaction) {
  const { customId, member, channel, guild } = interaction;
  const vcData = db.get('temp_vc', channel.id);

  if (!vcData || vcData.ownerId !== member.id) {
    return interaction.reply({ content: '❌ Doar proprietarul canalului poate folosi aceste butoane!', flags: MessageFlags.Ephemeral });
  }

  switch (customId) {
    case 'vc_lock':
      await channel.permissionOverwrites.edit(guild.id, { Connect: false });
      await interaction.reply({ content: '🔒 Canalul a fost blocat!', flags: MessageFlags.Ephemeral });
      break;

    case 'vc_unlock':
      await channel.permissionOverwrites.edit(guild.id, { Connect: true });
      await interaction.reply({ content: '🔓 Canalul a fost deblocat!', flags: MessageFlags.Ephemeral });
      break;

    case 'vc_hide':
      await channel.permissionOverwrites.edit(guild.id, { ViewChannel: false });
      await interaction.reply({ content: '👻 Canalul este acum ascuns!', flags: MessageFlags.Ephemeral });
      break;

    case 'vc_show':
      await channel.permissionOverwrites.edit(guild.id, { ViewChannel: true });
      await interaction.reply({ content: '👁️ Canalul este acum vizibil!', flags: MessageFlags.Ephemeral });
      break;

    case 'vc_delete':
      await interaction.reply({ content: '🗑️ Canalul va fi șters...', flags: MessageFlags.Ephemeral });
      await channel.delete().catch(() => {});
      db.del('temp_vc', channel.id);
      break;

    case 'vc_rename': {
      const modal = new ModalBuilder().setCustomId('vc_modal_rename').setTitle('Redenumire Canal');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('vc_input_rename').setLabel('Nume nou').setStyle(TextInputStyle.Short).setRequired(true)));
      await interaction.showModal(modal);
      break;
    }

    case 'vc_limit': {
      const modal = new ModalBuilder().setCustomId('vc_modal_limit').setTitle('Limită Membri');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('vc_input_limit').setLabel('Număr (0 = nelimitat)').setStyle(TextInputStyle.Short).setRequired(true)));
      await interaction.showModal(modal);
      break;
    }

    case 'vc_kick': {
      const modal = new ModalBuilder().setCustomId('vc_modal_kick').setTitle('Kick User');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('vc_input_kick').setLabel('ID Membru').setStyle(TextInputStyle.Short).setRequired(true)));
      await interaction.showModal(modal);
      break;
    }

    case 'vc_permit': {
      const modal = new ModalBuilder().setCustomId('vc_modal_permit').setTitle('Permit User');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('vc_input_permit').setLabel('ID Membru').setStyle(TextInputStyle.Short).setRequired(true)));
      await interaction.showModal(modal);
      break;
    }

    case 'vc_transfer': {
      const modal = new ModalBuilder().setCustomId('vc_modal_transfer').setTitle('Transfer Owner');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('vc_input_transfer').setLabel('ID Noul Owner').setStyle(TextInputStyle.Short).setRequired(true)));
      await interaction.showModal(modal);
      break;
    }
  }
}

async function handleModal(interaction) {
  const { customId, channel, fields, guild } = interaction;
  
  if (customId === 'vc_modal_rename') {
    const name = fields.getTextInputValue('vc_input_rename');
    await channel.setName(`🔊 ${name}`);
    await interaction.reply({ content: `✅ Numele canalului a fost schimbat în: **${name}**`, flags: MessageFlags.Ephemeral });
  }

  if (customId === 'vc_modal_limit') {
    const limit = parseInt(fields.getTextInputValue('vc_input_limit'));
    if (isNaN(limit) || limit < 0 || limit > 99) return interaction.reply({ content: '❌ Te rugăm să introduci un număr valid (0-99)!', flags: MessageFlags.Ephemeral });
    await channel.setUserLimit(limit);
    await interaction.reply({ content: `✅ Limita a fost setată la: **${limit === 0 ? 'Nelimitat' : limit}**`, flags: MessageFlags.Ephemeral });
  }

  if (customId === 'vc_modal_kick') {
    const userId = fields.getTextInputValue('vc_input_kick');
    const member = guild.members.cache.get(userId);
    if (!member || member.voice.channelId !== channel.id) return interaction.reply({ content: '❌ Membrul nu este pe canal!', flags: MessageFlags.Ephemeral });
    await member.voice.setChannel(null);
    await interaction.reply({ content: `✅ Membrul ${member.user.tag} a fost scos de pe canal!`, flags: MessageFlags.Ephemeral });
  }

  if (customId === 'vc_modal_permit') {
    const userId = fields.getTextInputValue('vc_input_permit');
    const user = guild.members.cache.get(userId);
    if (!user) return interaction.reply({ content: '❌ Membrul nu a putut fi găsit!', flags: MessageFlags.Ephemeral });
    await channel.permissionOverwrites.edit(user.id, { Connect: true });
    await interaction.reply({ content: `✅ Membrul ${user.user.tag} are acum permisiunea de a intra!`, flags: MessageFlags.Ephemeral });
  }

  if (customId === 'vc_modal_transfer') {
    const userId = fields.getTextInputValue('vc_input_transfer');
    const user = guild.members.cache.get(userId);
    if (!user || user.bot) return interaction.reply({ content: '❌ Membrul nu a putut fi găsit!', flags: MessageFlags.Ephemeral });
    
    db.set('temp_vc', channel.id, { ownerId: user.id });
    await channel.permissionOverwrites.edit(user.id, { ManageChannels: true, MoveMembers: true, MuteMembers: true, DeafenMembers: true });
    await interaction.reply({ content: `👑 Ownership-ul canalului a fost transferat către ${user}!`, flags: MessageFlags.Ephemeral });
  }
}

module.exports = { handleInteraction, handleModal };
