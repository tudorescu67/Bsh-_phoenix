/* by Capitanul burcea,alex */
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const db = require('./database');
const { recordAction } = require('./logger');

const MAX_MINUTES = Number(process.env.GIVEAWAY_MAX_MINUTES || 43200);
const MAX_WINNERS = Number(process.env.GIVEAWAY_MAX_WINNERS || 20);

function giveawayButton(msgId, count = 0, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway_enter_${msgId}`)
      .setLabel(`${count} Participanti`)
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
  );
}

async function handleGiveawayButton(interaction) {
  const id = interaction.customId;

  if (id === 'giveaway_enter' || id.startsWith('giveaway_enter_')) {
    const msgId = id.startsWith('giveaway_enter_') ? id.slice('giveaway_enter_'.length) : interaction.message.id;
    const giveaway = db.get('giveaways', msgId);

    if (!giveaway || giveaway.ended || giveaway.endTime <= Date.now()) {
      return interaction.reply({ content: 'Giveaway-ul nu mai este activ.', flags: MessageFlags.Ephemeral });
    }

    giveaway.participants = Array.isArray(giveaway.participants) ? giveaway.participants : [];
    if (giveaway.participants.includes(interaction.user.id)) {
      return interaction.reply({ content: 'Esti deja inscris la acest giveaway.', flags: MessageFlags.Ephemeral });
    }

    giveaway.participants.push(interaction.user.id);
    db.set('giveaways', msgId, giveaway);

    await interaction.message.edit({
      components: [giveawayButton(msgId, giveaway.participants.length)],
    }).catch(() => {});

    await recordAction(interaction.guild, {
      type: 'giveaway',
      action: 'giveaway.join',
      actor: interaction.user,
      target: msgId,
      metadata: { prize: giveaway.prize, participants: giveaway.participants.length },
      discord: false,
    });

    return interaction.reply({ content: `Te-ai inscris la giveaway: **${giveaway.prize}**.`, flags: MessageFlags.Ephemeral });
  }

  if (id === 'panel_giveaway_view') {
    const giveaways = db.getAll('giveaways') || {};
    const active = Object.entries(giveaways).filter(([, giveaway]) => !giveaway.ended && giveaway.endTime > Date.now());

    if (!active.length) {
      return interaction.reply({ content: 'Nu exista giveaway-uri active in acest moment.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('Giveaway-uri active')
      .setDescription(active.map(([msgId, giveaway]) => {
        const link = `https://discord.com/channels/${interaction.guild.id}/${giveaway.channelId}/${msgId}`;
        return `**[${giveaway.prize}](${link})**\n> Participanti: **${giveaway.participants?.length || 0}**\n> Sfarseste: <t:${Math.floor(giveaway.endTime / 1000)}:R>`;
      }).join('\n\n'))
      .setFooter({ text: 'phoenixrisen.ro' });

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  if (id === 'panel_giveaway_create') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Doar staff-ul poate crea giveaway-uri.', flags: MessageFlags.Ephemeral });
    }

    const modal = new ModalBuilder()
      .setCustomId('panel_giveaway_modal_create')
      .setTitle('Creeaza Giveaway');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('prize')
          .setLabel('Premiul')
          .setPlaceholder('ex: 1x VIP Gold')
          .setRequired(true)
          .setStyle(TextInputStyle.Short),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('duration')
          .setLabel('Durata (minute)')
          .setPlaceholder('ex: 60')
          .setRequired(true)
          .setStyle(TextInputStyle.Short),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('winners')
          .setLabel('Numar castigatori')
          .setPlaceholder('ex: 1')
          .setValue('1')
          .setRequired(true)
          .setStyle(TextInputStyle.Short),
      ),
    );

    await interaction.showModal(modal);
  }
}

async function handleGiveawayModal(interaction) {
  if (interaction.customId !== 'panel_giveaway_modal_create') return;

  const prize = interaction.fields.getTextInputValue('prize').trim().slice(0, 160);
  const durationMin = Number.parseInt(interaction.fields.getTextInputValue('duration'), 10);
  const winnersCount = Number.parseInt(interaction.fields.getTextInputValue('winners'), 10) || 1;

  if (!prize) return interaction.reply({ content: 'Premiul este obligatoriu.', flags: MessageFlags.Ephemeral });
  if (!Number.isFinite(durationMin) || durationMin <= 0 || durationMin > MAX_MINUTES) {
    return interaction.reply({ content: `Durata trebuie sa fie intre 1 si ${MAX_MINUTES} minute.`, flags: MessageFlags.Ephemeral });
  }
  if (winnersCount < 1 || winnersCount > MAX_WINNERS) {
    return interaction.reply({ content: `Castigatorii trebuie sa fie intre 1 si ${MAX_WINNERS}.`, flags: MessageFlags.Ephemeral });
  }

  const endTime = Date.now() + durationMin * 60000;
  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('GIVEAWAY NOU')
    .setDescription(`Premiu: **${prize}**\nCastigatori: **${winnersCount}**\nSfarseste: <t:${Math.floor(endTime / 1000)}:R> (<t:${Math.floor(endTime / 1000)}:f>)`)
    .setFooter({ text: 'Apasa butonul pentru a participa.' })
    .setTimestamp();

  const message = await interaction.channel.send({
    embeds: [embed],
    components: [giveawayButton('pending', 0)],
  });

  await message.edit({ components: [giveawayButton(message.id, 0)] }).catch(() => {});

  db.set('giveaways', message.id, {
    prize,
    endTime,
    winnersCount,
    guildId: interaction.guild.id,
    channelId: interaction.channel.id,
    participants: [],
    ended: false,
    createdBy: interaction.user.id,
    createdAt: Date.now(),
  });

  await interaction.reply({ content: 'Giveaway creat cu succes.', flags: MessageFlags.Ephemeral });
  await recordAction(interaction.guild, {
    type: 'giveaway',
    action: 'giveaway.create',
    actor: interaction.user,
    target: message.id,
    metadata: { prize, durationMin, winnersCount, channelId: interaction.channel.id },
  });

  setTimeout(() => endGiveaway(interaction.client, message.id).catch(console.error), durationMin * 60000);
}

async function endGiveaway(client, msgId) {
  const giveaway = db.get('giveaways', msgId);
  if (!giveaway || giveaway.ended) return;

  const guild = client.guilds.cache.get(giveaway.guildId || client.guilds.cache.first()?.id);
  if (!guild) return;
  const channel = guild.channels.cache.get(giveaway.channelId);
  if (!channel) return;
  const message = await channel.messages.fetch(msgId).catch(() => null);
  if (!message) return;

  const participants = Array.isArray(giveaway.participants) ? giveaway.participants : [];
  const winners = [];
  const pool = [...participants];
  for (let index = 0; index < Math.min(giveaway.winnersCount, pool.length); index += 1) {
    const winnerId = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    winners.push(`<@${winnerId}>`);
  }

  const resultEmbed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Giveaway incheiat')
    .setDescription(`Premiu: **${giveaway.prize}**\nCastigatori: ${winners.length ? winners.join(', ') : 'Niciun participant.'}`)
    .setFooter({ text: 'phoenixrisen.ro' })
    .setTimestamp();

  await message.edit({ embeds: [resultEmbed], components: [giveawayButton(msgId, participants.length, true)] }).catch(() => {});
  if (winners.length) await channel.send(`Felicitari ${winners.join(', ')}! Ati castigat **${giveaway.prize}**.`);

  giveaway.ended = true;
  giveaway.endedAt = Date.now();
  giveaway.winners = winners;
  db.set('giveaways', msgId, giveaway);

  await recordAction(guild, {
    type: 'giveaway',
    action: 'giveaway.end',
    actorId: 'system',
    target: msgId,
    metadata: { prize: giveaway.prize, participants: participants.length, winners },
  });
}

module.exports = { handleGiveawayButton, handleGiveawayModal, endGiveaway };
