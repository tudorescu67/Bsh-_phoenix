/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Șterge mesaje sau resetează canalul')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('messages')
        .setDescription('Șterge un număr specific de mesaje')
        .addIntegerOption(o => o.setName('numar').setDescription('Numărul de mesaje (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('full')
        .setDescription('Șterge TOATE mesajele prin recrearea canalului')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'messages') {
      const numar = interaction.options.getInteger('numar');
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      try {
        const deleted = await interaction.channel.bulkDelete(numar, true);
        await interaction.editReply({ embeds: [successEmbed(`Am șters **${deleted.size}** mesaje.`)] });
        
        await sendLog(interaction.guild, 'clear', {
          moderator: interaction.user,
          channel: interaction.channel,
          count: deleted.size,
        });
      } catch (err) {
        console.error(err);
        await interaction.editReply({ embeds: [errorEmbed('Nu am putut șterge mesajele (posibil mai vechi de 14 zile).')] });
      }
    } 
    
    else if (subcommand === 'full') {
      await interaction.reply({ 
        content: '⚠️ Ești sigur că vrei să ștergi TOATE mesajele? Canalul va fi recreat.', 
        flags: MessageFlags.Ephemeral,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 4,
                label: 'Confirmă Purge Full',
                custom_id: 'confirm_purge_full'
              }
            ]
          }
        ]
      });

      const filter = i => i.customId === 'confirm_purge_full' && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000, max: 1 });

      collector.on('collect', async i => {
        try {
          const oldChannel = interaction.channel;
          const position = oldChannel.position;
          const newChannel = await oldChannel.clone();
          
          await oldChannel.delete('Purge Full');
          await newChannel.setPosition(position);
          
          await newChannel.send({ 
            embeds: [new EmbedBuilder()
              .setColor(0x00ff00)
              .setDescription(`🧹 Canalul a fost resetat de către ${interaction.user}.`)
            ] 
          }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));

          await sendLog(interaction.guild, 'clear', {
            moderator: interaction.user,
            channel: { name: oldChannel.name },
            count: 'TOATE (Channel Reset)',
          });
        } catch (err) {
          console.error(err);
          await i.reply({ content: 'Eroare la recrearea canalului.', flags: MessageFlags.Ephemeral });
        }
      });
    }
  },
};
