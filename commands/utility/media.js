/* by Capitanul burcea,alex */
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const FormData = require('form-data');

const KINDS = ['music', 'photo', 'art', 'voice', 'video'];

function apiConfig() {
  const baseUrl = String(process.env.BSH_CONTROL_API_URL || process.env.GAMES_API_URL || 'https://api.bsh.net').replace(/\/+$/, '');
  const token = process.env.BSH_BOT_MEDIA_TOKEN || process.env.BSH_MEDIA_TOKEN;
  return { baseUrl, token };
}

function authHeaders(extra = {}) {
  const { token } = apiConfig();
  if (!token) throw new Error('Lipseste BSH_BOT_MEDIA_TOKEN in .env pentru upload/download media din bot.');
  return { 'X-BSH-Bot-Token': token, ...extra };
}

function pickFileName(disposition, fallback) {
  const match = String(disposition || '').match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback || 'bsh-media.bin';
}

module.exports = {
  category: 'media',
  aliases: ['media', 'library', 'galerie'],
  data: new SlashCommandBuilder()
    .setName('media')
    .setDescription('Media BSH: upload, list si download')
    .addSubcommand((sub) => sub
      .setName('upload')
      .setDescription('Incarca un fisier in Media Library BSH')
      .addStringOption((option) => option.setName('kind').setDescription('Tip fisier').setRequired(true).addChoices(...KINDS.map((kind) => ({ name: kind, value: kind }))))
      .addAttachmentOption((option) => option.setName('file').setDescription('Fisier muzica/poza/art/voce/video').setRequired(true))
      .addStringOption((option) => option.setName('title').setDescription('Titlu in biblioteca').setRequired(false)))
    .addSubcommand((sub) => sub
      .setName('list')
      .setDescription('Listeaza ultimele fisiere media')
      .addStringOption((option) => option.setName('kind').setDescription('Filtru tip fisier').setRequired(false).addChoices(...KINDS.map((kind) => ({ name: kind, value: kind })))))
    .addSubcommand((sub) => sub
      .setName('download')
      .setDescription('Descarca un fisier media dupa ID')
      .addStringOption((option) => option.setName('id').setDescription('ID media din /media list').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const { baseUrl } = apiConfig();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'upload') {
      const kind = interaction.options.getString('kind', true);
      const attachment = interaction.options.getAttachment('file', true);
      const title = interaction.options.getString('title') || attachment.name;

      const downloaded = await axios.get(attachment.url, { responseType: 'arraybuffer', timeout: 45000 });
      const form = new FormData();
      form.append('file', Buffer.from(downloaded.data), {
        filename: attachment.name || `${kind}-upload.bin`,
        contentType: attachment.contentType || 'application/octet-stream',
      });
      form.append('kind', kind);
      form.append('title', title);
      form.append('source', 'bot');

      const { data } = await axios.post(`${baseUrl}/api/bot-media/upload`, form, {
        headers: authHeaders(form.getHeaders()),
        maxBodyLength: Infinity,
        timeout: 60000,
      });

      return interaction.editReply(`Upload OK: ${data.title} (${data.id})`);
    }

    if (sub === 'list') {
      const kind = interaction.options.getString('kind');
      const { data } = await axios.get(`${baseUrl}/api/bot-media/library`, {
        params: kind ? { kind } : {},
        headers: authHeaders(),
        timeout: 30000,
      });
      const lines = (data.items || []).slice(0, 10).map((item) => `\`${item.id}\` - ${item.title} (${item.kind}, ${Math.round((item.size || 0) / 1024)} KB)`);
      const embed = new EmbedBuilder()
        .setColor(0x00e5ff)
        .setTitle('BSH Media Library')
        .setDescription(lines.join('\n') || 'Nu exista fisiere media inca.');
      return interaction.editReply({ embeds: [embed] });
    }

    const id = interaction.options.getString('id', true);
    const response = await axios.get(`${baseUrl}/api/bot-media/${encodeURIComponent(id)}/download`, {
      headers: authHeaders(),
      responseType: 'arraybuffer',
      timeout: 60000,
    });
    const buffer = Buffer.from(response.data);
    const limit = Number(process.env.BOT_MEDIA_DISCORD_MAX_BYTES || 25 * 1024 * 1024);
    if (buffer.length > limit) {
      return interaction.editReply(`Fisierul are ${Math.round(buffer.length / 1024 / 1024)} MB si e prea mare pentru upload direct in Discord. Descarca-l din dashboard.`);
    }
    const fileName = pickFileName(response.headers['content-disposition'], `${id}.bin`);
    return interaction.editReply({ files: [new AttachmentBuilder(buffer, { name: fileName })] });
  },
};
