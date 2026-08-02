/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
  category: 'ticketing',
  data: new SlashCommandBuilder()
    .setName('ticket-transcript')
    .setDescription('Genereaza transcript pentru ticketul curent')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 8,
  async execute(interaction) {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText || !interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Comanda functioneaza doar in canale ticket-*.', flags: MessageFlags.Ephemeral });
    }

    const discordTranscripts = require('discord-html-transcripts');
    const attachment = await discordTranscripts.createTranscript(interaction.channel);
    return interaction.reply({ content: 'Transcript generat.', files: [attachment], flags: MessageFlags.Ephemeral });
  },
};
