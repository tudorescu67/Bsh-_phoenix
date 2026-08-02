/* by Capitanul burcea,alex */
const {
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const db = require('./database');

const CORE_FIELDS = [
  ['name', 'Cum te cheama?', 'Nume/porecla'],
  ['age', 'Cati ani ai?', 'Ex: 18'],
  ['joinedFor', 'De ce ai intrat?', 'Ex: prieteni, jocuri, muzica'],
  ['communityReason', 'De ce ai ales comunitatea noastra?', 'Spune pe scurt'],
  ['hobby', 'Ce hobby ai?', 'Gaming, art, DJ, programare...'],
];

const EXTRA_FIELDS = [
  ['likes', 'Ce iti place sa faci?', 'Social, jocuri, creare, editare...'],
  ['music', 'Ce muzica iti place?', 'Genuri/artisti preferati'],
  ['art', 'Ce desene/edits preferi?', 'Fan art, anime, logo, video...'],
  ['programming', 'Iti place programarea?', 'Da/nu + ce limbaje'],
  ['djProducer', 'Esti DJ/producer?', 'Da/nu + ce stil'],
];

function envList(name) {
  return String(process.env[name] || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasPositive(value) {
  return /\b(da|yes|yep|producer|dj|program|code|javascript|python|java|c\+\+|html|css|desen|edit|art|muzica|music)\b/i.test(String(value || ''));
}

function buildModal(type) {
  const fields = type === 'extra' ? EXTRA_FIELDS : CORE_FIELDS;
  const modal = new ModalBuilder()
    .setCustomId(`onboarding_${type}`)
    .setTitle(type === 'extra' ? 'BSH - Intrebari Extra' : 'BSH - Intrebari Start');

  for (const [id, label, placeholder] of fields) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(id)
          .setLabel(label)
          .setPlaceholder(placeholder)
          .setStyle(TextInputStyle.Short)
          .setRequired(type !== 'extra'),
      ),
    );
  }

  return modal;
}

async function openModal(interaction, type = 'core') {
  return interaction.showModal(buildModal(type));
}

function getRecord(guildId, userId) {
  return db.get('onboarding', `${guildId}:${userId}`) || {
    guildId,
    userId,
    answers: {},
    answeredCount: 0,
    completed: false,
    rolesGranted: [],
    createdAt: new Date().toISOString(),
  };
}

async function addRoles(member, answers) {
  const roles = new Set([
    ...envList('ONBOARDING_STARTER_ROLE_IDS'),
    ...envList('BSH_STARTER_ROLE_IDS'),
  ]);

  if (process.env.ONBOARDING_VERIFIED_ROLE_ID) roles.add(process.env.ONBOARDING_VERIFIED_ROLE_ID);
  if (hasPositive(answers.music) && process.env.ONBOARDING_MUSIC_ROLE_ID) roles.add(process.env.ONBOARDING_MUSIC_ROLE_ID);
  if (hasPositive(answers.art) && process.env.ONBOARDING_ART_ROLE_ID) roles.add(process.env.ONBOARDING_ART_ROLE_ID);
  if (hasPositive(answers.programming) && process.env.ONBOARDING_PROGRAMMER_ROLE_ID) roles.add(process.env.ONBOARDING_PROGRAMMER_ROLE_ID);
  if (hasPositive(answers.djProducer) && process.env.ONBOARDING_DJ_ROLE_ID) roles.add(process.env.ONBOARDING_DJ_ROLE_ID);

  const granted = [];
  for (const roleId of roles) {
    if (!member.guild.roles.cache.has(roleId) || member.roles.cache.has(roleId)) continue;
    await member.roles.add(roleId).then(() => granted.push(roleId)).catch(() => {});
  }
  return granted;
}

async function handleModal(interaction) {
  const type = interaction.customId === 'onboarding_extra' ? 'extra' : 'core';
  const fields = type === 'extra' ? EXTRA_FIELDS : CORE_FIELDS;
  const record = getRecord(interaction.guild.id, interaction.user.id);

  for (const [id] of fields) {
    const value = interaction.fields.getTextInputValue(id)?.trim();
    if (value) record.answers[id] = value.slice(0, 500);
  }

  record.answeredCount = Object.values(record.answers).filter(Boolean).length;
  record.completed = record.answeredCount >= 5;
  record.updatedAt = new Date().toISOString();

  const granted = record.completed ? await addRoles(interaction.member, record.answers) : [];
  record.rolesGranted = [...new Set([...(record.rolesGranted || []), ...granted])];
  db.set('onboarding', `${interaction.guild.id}:${interaction.user.id}`, record);

  const embed = new EmbedBuilder()
    .setColor(record.completed ? 0x57F287 : 0xFEE75C)
    .setTitle(record.completed ? 'Profil BSH completat' : 'Raspunsuri salvate')
    .setDescription(record.completed
      ? 'Ai raspuns la minim 5 intrebari. Rolurile de inceput au fost verificate.'
      : `Ai raspuns la ${record.answeredCount}/5 intrebari necesare.`)
    .addFields(
      { name: 'Intrebari raspunse', value: String(record.answeredCount), inline: true },
      { name: 'Roluri acordate acum', value: granted.length ? granted.map((id) => `<@&${id}>`).join(', ') : '-', inline: true },
    );

  return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function showStatus(interaction) {
  const record = getRecord(interaction.guild.id, interaction.user.id);
  const answers = Object.entries(record.answers || {})
    .map(([key, value]) => `**${key}:** ${String(value).slice(0, 120)}`)
    .join('\n') || 'Nu ai raspuns inca.';

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('Profilul tau BSH')
        .setDescription(answers)
        .addFields(
          { name: 'Status', value: record.completed ? 'Completat' : 'In progres', inline: true },
          { name: 'Raspunsuri', value: String(record.answeredCount || 0), inline: true },
        ),
    ],
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = { openModal, handleModal, showStatus };
