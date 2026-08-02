/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('Sistem de economie Phoenix Risen')
    .addSubcommand(s => s.setName('daily').setDescription('Primește recompensa zilnică'))
    .addSubcommand(s => s.setName('bal').setDescription('Vezi balanța ta sau a altui utilizator')
      .addUserOption(o => o.setName('utilizator').setDescription('Utilizatorul')))
    .addSubcommand(s => s.setName('work').setDescription('Muncește pentru bani'))
    .addSubcommand(s => s.setName('pay').setDescription('Trimite bani altui utilizator')
      .addUserOption(o => o.setName('utilizator').setDescription('Destinatarul').setRequired(true))
      .addIntegerOption(o => o.setName('suma').setDescription('Suma de trimis').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('coinflip').setDescription('Pariază bani pe cap sau pajură')
      .addIntegerOption(o => o.setName('suma').setDescription('Suma pariată').setRequired(true).setMinValue(10))
      .addStringOption(o => o.setName('partea').setDescription('Cap sau Pajură').setRequired(true).addChoices(
        { name: 'Cap', value: 'cap' },
        { name: 'Pajură', value: 'pajura' }
      )))
    .addSubcommand(s => s.setName('slots').setDescription('Încearcă-ți norocul la păcănele')
      .addIntegerOption(o => o.setName('suma').setDescription('Suma pariată').setRequired(true).setMinValue(10))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const key = `${guildId}_${userId}`;

    let data = db.get('economy', key) || { balance: 0, lastDaily: 0, lastWork: 0 };

    if (sub === 'daily') {
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000;
      if (now - data.lastDaily < cooldown) {
        const remaining = cooldown - (now - data.lastDaily);
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        return interaction.reply({ content: `⏳ Ai primit deja recompensa! Revino peste **${h}h ${m}m**.`, flags: MessageFlags.Ephemeral });
      }

      const reward = 500;
      data.balance += reward;
      data.lastDaily = now;
      db.set('economy', key, data);

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle('💰 Recompensă Zilnică')
          .setDescription(`Ai primit **${reward} 💸**! Balanță actuală: **${data.balance} 💸**`)
          .setFooter({ text: 'phoenixrisen.ro' })]
      });
    }

    if (sub === 'bal') {
      const target = interaction.options.getUser('utilizator') ?? interaction.user;
      const targetKey = `${guildId}_${target.id}`;
      const targetData = db.get('economy', targetKey) || { balance: 0 };

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`🏦 Balanță — ${target.username}`)
          .setDescription(`Portofel: **${targetData.balance} 💸**`)
          .setFooter({ text: 'phoenixrisen.ro' })]
      });
    }

    if (sub === 'work') {
      const now = Date.now();
      const cooldown = 60 * 60 * 1000; // 1 ora
      if (now - data.lastWork < cooldown) {
        const remaining = cooldown - (now - data.lastWork);
        const m = Math.floor(remaining / 60000);
        return interaction.reply({ content: `⏳ Ești obosit! Mai poți munci peste **${m} minute**.`, flags: MessageFlags.Ephemeral });
      }

      const jobs = ['Programator', 'Mecanic', 'Chef', 'Pescari', 'Miner', 'Șofer de TIR'];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const gain = Math.floor(Math.random() * 300) + 100;

      data.balance += gain;
      data.lastWork = now;
      db.set('economy', key, data);

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('👷 Muncă')
          .setDescription(`Ai lucrat ca **${job}** și ai câștigat **${gain} 💸**!`)
          .setFooter({ text: 'phoenixrisen.ro' })]
      });
    }

    if (sub === 'pay') {
      const target = interaction.options.getUser('utilizator');
      const amount = interaction.options.getInteger('suma');

      if (target.id === userId) return interaction.reply({ content: '❌ Nu îți poți trimite bani singur.', flags: MessageFlags.Ephemeral });
      if (data.balance < amount) return interaction.reply({ content: '❌ Nu ai suficienți bani.', flags: MessageFlags.Ephemeral });

      const targetKey = `${guildId}_${target.id}`;
      let targetData = db.get('economy', targetKey) || { balance: 0, lastDaily: 0, lastWork: 0 };

      data.balance -= amount;
      targetData.balance += amount;

      db.set('economy', key, data);
      db.set('economy', targetKey, targetData);

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x57f287)
          .setDescription(`✅ I-ai trimis **${amount} 💸** lui ${target}!`)
          .setFooter({ text: 'phoenixrisen.ro' })]
      });
    }

    if (sub === 'coinflip') {
      const amount = interaction.options.getInteger('suma');
      const side = interaction.options.getString('partea');

      if (data.balance < amount) return interaction.reply({ content: '❌ Nu ai suficienți bani.', flags: MessageFlags.Ephemeral });

      const win = Math.random() < 0.5;
      const choices = ['cap', 'pajura'];
      const result = win ? side : choices.find(c => c !== side);

      if (win) {
        data.balance += amount;
        db.set('economy', key, data);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('🪙 Coinflip — Câștigător!')
            .setDescription(`Rezultat: **${result.toUpperCase()}**\nAi câștigat **${amount} 💸**!\nBalanță actuală: **${data.balance} 💸**`)
            .setFooter({ text: 'phoenixrisen.ro' })]
        });
      } else {
        data.balance -= amount;
        db.set('economy', key, data);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('🪙 Coinflip — Pierzător')
            .setDescription(`Rezultat: **${result.toUpperCase()}**\nAi pierdut **${amount} 💸**.\nBalanță actuală: **${data.balance} 💸**`)
            .setFooter({ text: 'phoenixrisen.ro' })]
        });
      }
    }

    if (sub === 'slots') {
      const amount = interaction.options.getInteger('suma');
      if (data.balance < amount) return interaction.reply({ content: '❌ Nu ai suficienți bani.', flags: MessageFlags.Ephemeral });

      const emojis = ['🍒', '🍋', '💎', '7️⃣', '🔔'];
      const reel1 = emojis[Math.floor(Math.random() * emojis.length)];
      const reel2 = emojis[Math.floor(Math.random() * emojis.length)];
      const reel3 = emojis[Math.floor(Math.random() * emojis.length)];

      const win = reel1 === reel2 && reel2 === reel3;
      const partialWin = reel1 === reel2 || reel2 === reel3 || reel1 === reel3;

      let multiplier = 0;
      if (win) multiplier = 5;
      else if (partialWin) multiplier = 1.5;

      if (multiplier > 0) {
        const reward = Math.floor(amount * multiplier);
        data.balance += (reward - amount);
        db.set('economy', key, data);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('🎰 Slots — Câștig!')
            .setDescription(`> [ ${reel1} | ${reel2} | ${reel3} ]\n\nAi câștigat **${reward} 💸**!\nBalanță: **${data.balance} 💸**`)
            .setFooter({ text: 'phoenixrisen.ro' })]
        });
      } else {
        data.balance -= amount;
        db.set('economy', key, data);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('🎰 Slots — Pierdut')
            .setDescription(`> [ ${reel1} | ${reel2} | ${reel3} ]\n\nAi pierdut **${amount} 💸**.\nBalanță: **${data.balance} 💸**`)
            .setFooter({ text: 'phoenixrisen.ro' })]
        });
      }
    }
  }
};
