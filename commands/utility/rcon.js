/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { sendRconCommand } = require('../../utils/rconClient');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_RESPONSE_LENGTH = 1800;

function hasRconAccess(interaction) {
  const allowedRoleId = process.env.RCON_ALLOWED_ROLE_ID;
  if (!allowedRoleId) return true;
  return interaction.member?.roles?.cache?.has(allowedRoleId);
}

function formatResponse(text) {
  const safeText = text.replace(/```/g, "'''");
  if (safeText.length <= MAX_RESPONSE_LENGTH) return safeText;
  return `${safeText.slice(0, MAX_RESPONSE_LENGTH)}\n... raspuns taiat, era prea lung.`;
}

function inlineCode(text) {
  return text.replace(/`/g, "'");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rcon')
    .setDescription('Trimite comenzi catre server prin RCON')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('send')
        .setDescription('Executa o comanda RCON')
        .addStringOption(o =>
          o.setName('comanda')
            .setDescription('Comanda trimisa catre consola serverului')
            .setRequired(true)
            .setMaxLength(1000)
        )
    ),
  cooldown: 3,

  async execute(interaction) {
    if (!hasRconAccess(interaction)) {
      return interaction.reply({
        embeds: [errorEmbed('Nu ai rolul configurat pentru RCON.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const host = process.env.RCON_HOST;
    const port = Number(process.env.RCON_PORT);
    const password = process.env.RCON_PASSWORD;
    const timeoutMs = Number(process.env.RCON_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

    if (!host || !port || !password) {
      return interaction.reply({
        embeds: [errorEmbed('RCON nu este configurat. Completeaza RCON_HOST, RCON_PORT si RCON_PASSWORD in .env.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const command = interaction.options.getString('comanda', true).trim();
    if (!command) {
      return interaction.reply({
        embeds: [errorEmbed('Comanda nu poate fi goala.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const response = await sendRconCommand({ host, port, password, command, timeoutMs });
      return interaction.editReply({
        embeds: [successEmbed(`Comanda trimisa:\n\`${inlineCode(command)}\`\n\nRaspuns:\n\`\`\`\n${formatResponse(response)}\n\`\`\``)],
      });
    } catch (err) {
      return interaction.editReply({
        embeds: [errorEmbed(`RCON a esuat: ${err.message || 'eroare necunoscuta'}`)],
      });
    }
  },
};
