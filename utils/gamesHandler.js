/* by Capitanul burcea,alex */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const db = require('./database');
const Blackjack = require('./blackjack');

const activeGames = new Map();

async function handleGamesPanel(interaction) {
  const id = interaction.customId;
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;
  const key = `${guildId}_${userId}`;
  let data = db.get('economy', key) || { balance: 0, lastDaily: 0, lastWork: 0 };

  if (id === 'panel_games_blackjack') {
    if (data.balance < 100) return interaction.reply({ content: '❌ Ai nevoie de cel puțin **100 💸** pentru a juca Blackjack!', flags: MessageFlags.Ephemeral });
    
    const game = new Blackjack(interaction.user, 100);
    game.start();
    
    const response = await interaction.reply({ 
      embeds: [game.getEmbed()], 
      components: game.getComponents(), 
      flags: MessageFlags.Ephemeral 
    });
    
    activeGames.set(interaction.user.id, game);
    return;
  }

  if (id.startsWith('bj_')) {
    const game = activeGames.get(userId);
    if (!game) return interaction.reply({ content: '❌ Nu ai niciun joc activ!', flags: MessageFlags.Ephemeral });

    if (id === 'bj_hit') {
      game.hit();
      if (game.status !== 'playing') {
        activeGames.delete(userId);
        if (game.status === 'win') data.balance += game.bet;
        else if (game.status === 'loss') data.balance -= game.bet;
        db.set('economy', key, data);
      }
      return interaction.update({ embeds: [game.getEmbed(game.status !== 'playing')], components: game.getComponents() });
    }

    if (id === 'bj_stand') {
      game.stand();
      activeGames.delete(userId);
      if (game.status === 'win') data.balance += game.bet;
      else if (game.status === 'loss') data.balance -= game.bet;
      db.set('economy', key, data);
      return interaction.update({ embeds: [game.getEmbed(true)], components: [] });
    }
  }

  if (id === 'panel_games_slots') {
    if (data.balance < 50) return interaction.reply({ content: '❌ Ai nevoie de cel puțin **50 💸** pentru a juca la slots!', flags: MessageFlags.Ephemeral });
    
    const emojis = ['🍒', '🍋', '💎', '7️⃣', '🔔'];
    const reel1 = emojis[Math.floor(Math.random() * emojis.length)];
    const reel2 = emojis[Math.floor(Math.random() * emojis.length)];
    const reel3 = emojis[Math.floor(Math.random() * emojis.length)];

    const win = reel1 === reel2 && reel2 === reel3;
    const partialWin = reel1 === reel2 || reel2 === reel3 || reel1 === reel3;
    const amount = 50;

    let multiplier = 0;
    if (win) multiplier = 10;
    else if (partialWin) multiplier = 2;

    if (multiplier > 0) {
      const reward = amount * multiplier;
      data.balance += (reward - amount);
      db.set('economy', key, data);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle('🎰 Slots — Câștig!')
          .setDescription(`> [ ${reel1} | ${reel2} | ${reel3} ]\n\nAi câștigat **${reward} 💸**!\nBalanță: **${data.balance} 💸**`)
          .setFooter({ text: 'phoenixrisen.ro' })],
        flags: MessageFlags.Ephemeral
      });
    } else {
      data.balance -= amount;
      db.set('economy', key, data);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle('🎰 Slots — Pierdut')
          .setDescription(`> [ ${reel1} | ${reel2} | ${reel3} ]\n\nAi pierdut **${amount} 💸**.\nBalanță: **${data.balance} 💸**`)
          .setFooter({ text: 'phoenixrisen.ro' })],
        flags: MessageFlags.Ephemeral
      });
    }
  }

  if (id === 'panel_games_flip') {
    if (data.balance < 50) return interaction.reply({ content: '❌ Ai nevoie de cel puțin **50 💸** pentru a juca la coinflip!', flags: MessageFlags.Ephemeral });
    
    const win = Math.random() < 0.5;
    const amount = 50;

    if (win) {
      data.balance += amount;
      db.set('economy', key, data);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('🪙 Coinflip — Câștig!').setDescription(`Ai câștigat **${amount} 💸**!\nBalanță: **${data.balance} 💸**`)],
        flags: MessageFlags.Ephemeral
      });
    } else {
      data.balance -= amount;
      db.set('economy', key, data);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('🪙 Coinflip — Pierdut').setDescription(`Ai pierdut **${amount} 💸**.\nBalanță: **${data.balance} 💸**`)],
        flags: MessageFlags.Ephemeral
      });
    }
  }

  if (id === 'panel_games_rank') {
    const levelData = db.get('levels', key) || { xp: 0, level: 0 };
    const nextLevelXP = (levelData.level + 1) * 500;
    
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📊 Rank — ${interaction.user.username}`)
        .addFields(
          { name: 'Nivel', value: `**${levelData.level}**`, inline: true },
          { name: 'XP', value: `**${levelData.xp}** / ${nextLevelXP}`, inline: true },
          { name: '💸 Bani', value: `**${data.balance}**`, inline: true }
        )
        .setFooter({ text: 'phoenixrisen.ro' })],
      flags: MessageFlags.Ephemeral
    });
  }
}

module.exports = { handleGamesPanel };
