/* by Capitanul burcea,alex */
const { ChannelType, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const triggerSystem = require('../../utils/triggerSystem');

const modeChoices = [
  { name: 'contains - textul contine fraza', value: 'contains' },
  { name: 'exact - text identic', value: 'exact' },
  { name: 'starts - textul incepe cu fraza', value: 'starts' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('triggers')
    .setDescription('Configureaza raspunsuri automate pe mesaje si canale')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) => subcommand
      .setName('add')
      .setDescription('Adauga un trigger')
      .addStringOption((option) => option.setName('phrase').setDescription('Fraza trigger').setRequired(true).setMaxLength(120))
      .addStringOption((option) => option.setName('response').setDescription('Raspuns. {user} {username} {server}').setRequired(true).setMaxLength(1800))
      .addChannelOption((option) => option.setName('channel').setDescription('Canal optional').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
      .addStringOption((option) => option.setName('mode').setDescription('Tip matching').addChoices(...modeChoices)))
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Listeaza triggerele'))
    .addSubcommand((subcommand) => subcommand
      .setName('remove')
      .setDescription('Sterge un trigger')
      .addStringOption((option) => option.setName('id').setDescription('ID trigger').setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const channel = interaction.options.getChannel('channel');
      const trigger = triggerSystem.addTrigger({
        guildId: interaction.guild.id,
        channelId: channel?.id || null,
        phrase: interaction.options.getString('phrase', true),
        response: interaction.options.getString('response', true),
        mode: interaction.options.getString('mode') || 'contains',
        createdBy: interaction.user.id,
      });

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x00d9ff).setDescription(`Trigger creat: **#${trigger.id}**${channel ? ` in ${channel}` : ' pe toate canalele'}.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === 'remove') {
      const id = interaction.options.getString('id', true);
      const removed = triggerSystem.removeTrigger(interaction.guild.id, id);
      return interaction.reply({
        content: removed ? `Trigger #${id} sters.` : `Nu am gasit triggerul #${id}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const triggers = triggerSystem.listTriggers(interaction.guild.id).slice(0, 20);
    const description = triggers.length
      ? triggers.map((trigger) => {
        const channel = trigger.channelId ? `<#${trigger.channelId}>` : 'toate canalele';
        return `**#${trigger.id}** [${trigger.mode}] ${channel} -> \`${trigger.phrase}\` (${trigger.uses || 0} uses)`;
      }).join('\n')
      : 'Nu exista triggere configurate.';

    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x00d9ff).setTitle('BSH Message Triggers').setDescription(description)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
