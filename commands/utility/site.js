/* by Capitanul burcea,alex */
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const db = require('../../utils/database');

const LINK_KEYS = [
  { name: 'bsh', label: 'BSH', env: 'BSH_PUBLIC_URL', fallback: 'https://bsh.net' },
  { name: 'apps', label: 'Apps', env: 'BSH_APPS_URL', fallback: 'https://bsh.net/apps' },
  { name: 'panel', label: 'Panel', env: 'BSH_PANEL_URL', fallback: 'https://panel.bsh.net' },
  { name: 'games', label: 'Games', env: 'BSH_GAMES_URL', fallback: 'https://games.bsh.net' },
  { name: 'status', label: 'Status', env: 'BSH_STATUS_URL', fallback: 'https://status.bsh.net' },
  { name: 'jarvis', label: 'Jarvis', env: 'JARVIS_PUBLIC_URL', fallback: 'https://jarvis.bsh.net' },
  { name: 'discord', label: 'Discord', env: 'DISCORD_INVITE_URL', fallback: 'https://discord.gg/bsh' },
];

function defaults() {
  return Object.fromEntries(LINK_KEYS.map((item) => [item.name, process.env[item.env] || item.fallback]));
}

function getConfig(guildId) {
  return { ...defaults(), ...(db.get('site_config', guildId) || {}) };
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function appsPayload(guildId) {
  const cfg = getConfig(guildId);
  const rows = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('BSH').setStyle(ButtonStyle.Link).setURL(cfg.bsh),
      new ButtonBuilder().setLabel('Apps').setStyle(ButtonStyle.Link).setURL(cfg.apps),
      new ButtonBuilder().setLabel('Panel').setStyle(ButtonStyle.Link).setURL(cfg.panel),
      new ButtonBuilder().setLabel('Games').setStyle(ButtonStyle.Link).setURL(cfg.games),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Status').setStyle(ButtonStyle.Link).setURL(cfg.status),
      new ButtonBuilder().setLabel('Jarvis').setStyle(ButtonStyle.Link).setURL(cfg.jarvis),
      new ButtonBuilder().setLabel('Discord').setStyle(ButtonStyle.Link).setURL(cfg.discord),
    ),
  ];

  const embed = new EmbedBuilder()
    .setColor(0x00d9ff)
    .setTitle('BSH Site & Apps')
    .setDescription('Link hub pentru dashboard, aplicatie, paneluri, status si Jarvis.')
    .addFields(
      { name: 'Comenzi utile', value: '`/stats profil` - profil membru\n`/stats server` - server stats\n`/site apps` - linkuri BSH', inline: false },
      { name: 'Multitool recomandat', value: 'OBS Studio, YouTube Studio, Spotify/playlist tools, Virtual Mic, FL Music Light, Art Studio, TikTok/Reels templates.', inline: false },
    )
    .setTimestamp();

  return { embeds: [embed], components: rows, flags: MessageFlags.Ephemeral };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('site')
    .setDescription('Configureaza si afiseaza linkurile BSH')
    .addSubcommand((sub) => sub
      .setName('apps')
      .setDescription('Afiseaza linkurile BSH pentru site, aplicatie si paneluri'))
    .addSubcommand((sub) => sub
      .setName('set')
      .setDescription('Seteaza un link BSH pentru server')
      .addStringOption((option) => option
        .setName('pagina')
        .setDescription('Ce link modifici')
        .setRequired(true)
        .addChoices(...LINK_KEYS.map((item) => ({ name: item.label, value: item.name }))))
      .addStringOption((option) => option
        .setName('url')
        .setDescription('URL complet https://...')
        .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'apps') return interaction.reply(appsPayload(interaction.guild.id));

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Ai nevoie de Manage Server pentru `/site set`.', flags: MessageFlags.Ephemeral });
    }

    const page = interaction.options.getString('pagina', true);
    const url = interaction.options.getString('url', true).trim();
    if (!validUrl(url)) {
      return interaction.reply({ content: 'URL invalid. Foloseste format complet, ex: https://bsh.net/apps', flags: MessageFlags.Ephemeral });
    }

    const cfg = getConfig(interaction.guild.id);
    cfg[page] = url;
    db.set('site_config', interaction.guild.id, cfg);

    return interaction.reply({ content: `Linkul **${page}** a fost setat la ${url}`, flags: MessageFlags.Ephemeral });
  },
};
