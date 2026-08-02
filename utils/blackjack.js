/* by Capitanul burcea,alex */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class Blackjack {
  constructor(player, bet) {
    this.player = player;
    this.bet = bet;
    this.deck = this.createDeck();
    this.playerHand = [];
    this.dealerHand = [];
    this.status = 'playing'; // playing, win, loss, tie
    this.message = null;
  }

  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ value, suit });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  }

  drawCard() {
    return this.deck.pop();
  }

  calculateValue(hand) {
    let value = 0;
    let aces = 0;
    for (const card of hand) {
      if (card.value === 'A') {
        aces++;
        value += 11;
      } else if (['J', 'Q', 'K'].includes(card.value)) {
        value += 10;
      } else {
        value += parseInt(card.value);
      }
    }
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  }

  start() {
    this.playerHand.push(this.drawCard(), this.drawCard());
    this.dealerHand.push(this.drawCard(), this.drawCard());
    
    if (this.calculateValue(this.playerHand) === 21) {
      this.status = 'win';
    }
  }

  hit() {
    this.playerHand.push(this.drawCard());
    if (this.calculateValue(this.playerHand) > 21) {
      this.status = 'loss';
    }
  }

  stand() {
    while (this.calculateValue(this.dealerHand) < 17) {
      this.dealerHand.push(this.drawCard());
    }
    const pVal = this.calculateValue(this.playerHand);
    const dVal = this.calculateValue(this.dealerHand);

    if (dVal > 21 || pVal > dVal) {
      this.status = 'win';
    } else if (pVal < dVal) {
      this.status = 'loss';
    } else {
      this.status = 'tie';
    }
  }

  getEmbed(showDealer = false) {
    const embed = new EmbedBuilder()
      .setColor(this.status === 'win' ? 0x57F287 : (this.status === 'loss' ? 0xED4245 : 0x5865F2))
      .setTitle('🃏 Blackjack')
      .addFields(
        { 
          name: `Mâna Ta (${this.calculateValue(this.playerHand)})`, 
          value: this.playerHand.map(c => `\`${c.value}${c.suit}\``).join(' '), 
          inline: true 
        },
        { 
          name: `Mâna Dealerului (${showDealer ? this.calculateValue(this.dealerHand) : '?'})`, 
          value: showDealer 
            ? this.dealerHand.map(c => `\`${c.value}${c.suit}\``).join(' ') 
            : `\`${this.dealerHand[0].value}${this.dealerHand[0].suit}\` \`??\``, 
          inline: true 
        }
      )
      .setFooter({ text: `Miză: ${this.bet} monede` });

    if (this.status === 'win') embed.setDescription('🎉 **Ai câștigat!**');
    else if (this.status === 'loss') embed.setDescription('❌ **Ai pierdut!**');
    else if (this.status === 'tie') embed.setDescription('🤝 **Remiză!**');

    return embed;
  }

  getComponents() {
    if (this.status !== 'playing') return [];
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Secondary)
      )
    ];
  }
}

module.exports = Blackjack;
