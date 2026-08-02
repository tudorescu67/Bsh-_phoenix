/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertizeaza un utilizator')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub => sub.setName('add').setDescription('Adauga un avertisment')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true))
      .addStringOption(o => o.setName('motiv').setDescription('Motivul').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('Listeaza avertismentele')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Sterge un avertisment specific')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true))
      .addIntegerOption(o => o.setName('index').setDescription('Numarul avertismentului (din /warn list)').setRequired(true).setMinValue(1)))
    .addSubcommand(sub => sub.setName('clear').setDescription('Sterge toate avertismentele')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true))),
  cooldown: 3,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('utilizator');
    const key = `${interaction.guild.id}-${target.id}`;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (sub === 'add') {
      const motiv = interaction.options.getString('motiv');
      const warns = db.get('warnings', key) || [];
      warns.push({ motiv, moderator: interaction.user.tag, moderatorId: interaction.user.id, timestamp: new Date().toISOString() });
      db.set('warnings', key, warns);
      await interaction.editReply({ embeds: [successEmbed(`**${target.tag}** a primit un avertisment.\n**Motiv:** ${motiv}\n**Total:** ${warns.length}`)] });
      await sendLog(interaction.guild, 'warn', {
        user: target, moderator: interaction.user, reason: motiv,
        extra: `Total avertismente: **${warns.length}**`,
        thumbnail: target.displayAvatarURL({ dynamic: true }),
      });
    } else if (sub === 'list') {
      const warns = db.get('warnings', key) || [];
      if (warns.length === 0) return interaction.editReply({ embeds: [successEmbed(`**${target.tag}** nu are avertismente.`)] });
      const embed = new EmbedBuilder().setColor(0xfee75c)
        .setTitle(`⚠️ Avertismente: ${target.tag}`)
        .setDescription(warns.map((w, i) => `**${i+1}.** ${w.motiv}\n> *${w.moderator}* • ${w.timestamp.slice(0,10)}`).join('\n\n'))
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Total: ${warns.length} avertismente` });
      await interaction.editReply({ embeds: [embed] });
    } else if (sub === 'remove') {
      const idx = interaction.options.getInteger('index') - 1;
      const warns = db.get('warnings', key) || [];
      if (idx < 0 || idx >= warns.length) return interaction.editReply({ embeds: [errorEmbed('Index invalid.')] });
      const removed = warns.splice(idx, 1)[0];
      db.set('warnings', key, warns);
      await interaction.editReply({ embeds: [successEmbed(`Avertismentul #${idx+1} al lui **${target.tag}** a fost sters.\n**Era:** ${removed.motiv}`)] });
    } else if (sub === 'clear') {
      db.del('warnings', key);
      await interaction.editReply({ embeds: [successEmbed(`Toate avertismentele lui **${target.tag}** au fost sterse.`)] });
    }
  },
};
