/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Management bot (doar Administratori)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('restart')
        .setDescription('Restartează procesul botului (PM2 va reporni automat)')
    )
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Afișează statistici și statusul botului')
    )
    .addSubcommand(sub =>
      sub.setName('health')
        .setDescription('Verifica rapid performanta si starea botului')
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Setează activitatea botului')
        .addStringOption(o => o.setName('text').setDescription('Textul statusului').setRequired(true))
        .addStringOption(o => o.setName('tip').setDescription('Tipul activității').setRequired(true).addChoices(
          { name: 'Playing', value: '0' },
          { name: 'Streaming', value: '1' },
          { name: 'Listening', value: '2' },
          { name: 'Watching', value: '3' },
          { name: 'Competing', value: '5' }
        ))
    )
    .addSubcommand(sub =>
      sub.setName('access')
        .setDescription('Gestionează accesul la comenzile de tip Owner')
        .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul').setRequired(true))
        .addStringOption(o => o.setName('actiune').setDescription('Adaugă sau elimină').setRequired(true).addChoices(
          { name: 'Adaugă', value: 'add' },
          { name: 'Elimină', value: 'remove' }
        ))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'restart') {
      await interaction.reply({ embeds: [successEmbed('Botul se restartează acum... Te salut! 👋')] });
      
      // Delay scurt pentru a trimite mesajul înainte de exit
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } 
    
    else if (subcommand === 'info') {
      const uptime = process.uptime();
      const h = Math.floor(uptime / 3600);
      const m = Math.floor((uptime % 3600) / 60);
      const s = Math.floor(uptime % 60);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📊 Informații Bot')
        .addFields(
          { name: '🕒 Uptime', value: `${h}h ${m}m ${s}s`, inline: true },
          { name: '💾 Memorie', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
          { name: '🌐 Serveri', value: `${interaction.client.guilds.cache.size}`, inline: true },
          { name: '👥 Useri', value: `${interaction.client.users.cache.size}`, inline: true },
          { name: '⚙️ Node.js', value: process.version, inline: true },
          { name: '📦 Discord.js', value: require('discord.js').version, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === 'health') {
      const uptime = process.uptime();
      const h = Math.floor(uptime / 3600);
      const m = Math.floor((uptime % 3600) / 60);
      const s = Math.floor(uptime % 60);
      const memory = process.memoryUsage();
      const dbStats = db.getStats ? db.getStats() : null;
      const api = Math.round(interaction.client.ws.ping);
      const color = api < 120 && memory.heapUsed < 300 * 1024 * 1024 ? 0x57f287 : api < 250 ? 0xfee75c : 0xed4245;

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle('Bot Health')
        .addFields(
          { name: 'Uptime', value: `${h}h ${m}m ${s}s`, inline: true },
          { name: 'Discord API', value: `${api}ms`, inline: true },
          { name: 'Comenzi', value: `${interaction.client.commands.size}`, inline: true },
          { name: 'Servere', value: `${interaction.client.guilds.cache.size}`, inline: true },
          { name: 'Heap folosit', value: `${(memory.heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true },
          { name: 'RSS', value: `${(memory.rss / 1024 / 1024).toFixed(1)} MB`, inline: true }
        )
        .setTimestamp();

      if (dbStats) {
        embed.addFields(
          { name: 'DB cache', value: `${dbStats.cachedFiles} fisiere`, inline: true },
          { name: 'DB pending', value: `${dbStats.pendingWrites} scrieri`, inline: true },
          { name: 'DB disk writes', value: `${dbStats.diskWrites}`, inline: true }
        );
      }

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    else if (subcommand === 'status') {
      const text = interaction.options.getString('text');
      const tip = parseInt(interaction.options.getString('tip'));

      interaction.client.user.setActivity(text, { type: tip });
      
      // Salvează în DB pentru a persista la restart
      db.set('bot_config', 'status', { text, tip });

      await interaction.reply({ embeds: [successEmbed(`Statusul a fost setat la: **${text}**`)] });
    }

    else if (subcommand === 'access') {
      const targetUser = interaction.options.getUser('utilizator');
      const action = interaction.options.getString('actiune');
      const devs = db.get('bot_config', 'developers') || [];

      if (action === 'add') {
        if (devs.includes(targetUser.id)) return interaction.reply({ content: '❌ Acest utilizator are deja acces.', flags: MessageFlags.Ephemeral });
        devs.push(targetUser.id);
        db.set('bot_config', 'developers', devs);
        return interaction.reply({ embeds: [successEmbed(`Acces adăugat pentru **${targetUser.tag}**.`)] });
      } else {
        const index = devs.indexOf(targetUser.id);
        if (index === -1) return interaction.reply({ content: '❌ Acest utilizator nu are acces.', flags: MessageFlags.Ephemeral });
        devs.splice(index, 1);
        db.set('bot_config', 'developers', devs);
        return interaction.reply({ embeds: [successEmbed(`Acces eliminat pentru **${targetUser.tag}**.`)] });
      }
    }
  },
};
