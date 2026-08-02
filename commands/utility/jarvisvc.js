/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const jarvisVoice = require('../../utils/jarvisVoiceAssistant');
let musicManager = null;
try {
  musicManager = require('../../utils/musicManager');
} catch {
  musicManager = null;
}

function statusEmbed(status) {
  const color = status.active ? 0x57f287 : 0xfee75c;
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('Jarvis VC Assistant')
    .setDescription(status.active
      ? `Activ in <#${status.channelId}>. Vorbeste normal in VC si Jarvis raspunde vocal.`
      : 'Jarvis VC nu este activ pe serverul acesta.')
    .addFields(
      { name: 'STT', value: status.sttReady ? 'ready' : 'configureaza STT', inline: true },
      { name: 'TTS', value: status.ttsReady ? 'ready' : 'configureaza TTS/espeak', inline: true },
      { name: 'Speaking', value: status.speaking ? 'da' : 'nu', inline: true },
      { name: 'Recording', value: `${status.recordingUsers || 0}`, inline: true },
    )
    .setFooter({ text: 'BSH Jarvis - Discord Voice' })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jarvisvc')
    .setDescription('Porneste Jarvis ca asistent vocal in voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('join')
        .setDescription('Baga Jarvis in voice channelul tau')
        .addBooleanOption(option =>
          option
            .setName('force')
            .setDescription('Opreste muzica activa si foloseste VC pentru Jarvis')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('leave')
        .setDescription('Scoate Jarvis din voice channel')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Arata statusul asistentului vocal')
    ),

  cooldown: 4,

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'status') {
      return interaction.reply({
        embeds: [statusEmbed(jarvisVoice.getStatus(interaction.guild.id))],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === 'leave') {
      const stopped = jarvisVoice.leave(interaction.guild.id);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(stopped ? 0xed4245 : 0xfee75c)
            .setTitle('Jarvis VC')
            .setDescription(stopped ? 'Jarvis a iesit din voice channel.' : 'Jarvis nu era activ in VC.'),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: 'Trebuie sa fii intr-un voice channel ca sa il bag pe Jarvis.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const force = interaction.options.getBoolean('force') || false;
    const queue = musicManager?.getQueueData?.(interaction.guild.id);
    const musicActive = Boolean(queue?.current || queue?.queue?.length);
    if (musicActive && !force) {
      return interaction.reply({
        content: 'Muzica este activa pe server. Ruleaza `/jarvisvc join force:true` daca vrei sa opresc muzica si sa pornesc Jarvis VC.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (musicActive && force) {
      musicManager.destroy?.(interaction.guild.id);
    }

    await interaction.deferReply();

    try {
      const session = await jarvisVoice.join(voiceChannel, interaction.channel, { client });
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('Jarvis VC pornit')
            .setDescription(`Jarvis asculta in <#${session.voiceChannelId}>.\nPoti vorbi cu el despre curiozitati, VPS, jocuri, muzica sau comunitate.`)
            .addFields(
              { name: 'Wake word', value: process.env.JARVIS_VOICE_WAKE_REQUIRED === 'true' ? 'obligatoriu: Jarvis/BSH' : 'optional', inline: true },
              { name: 'STT', value: process.env.JARVIS_VOICE_STT_URL || process.env.JARVIS_VOICE_STT_COMMAND || process.env.OPENAI_API_KEY ? 'configurat' : 'neconfigurat', inline: true },
              { name: 'TTS', value: process.env.JARVIS_VOICE_TTS_URL || process.env.OPENAI_API_KEY ? 'provider/API' : 'espeak-ng fallback', inline: true },
            )
            .setFooter({ text: 'Pe Contabo/Ubuntu instaleaza ffmpeg si espeak-ng pentru fallback vocal.' }),
        ],
      });
    } catch (err) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('Jarvis VC nu a pornit')
            .setDescription(String(err.message || err).slice(0, 1200)),
        ],
      });
    }
  },
};
