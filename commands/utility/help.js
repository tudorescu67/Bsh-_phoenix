/* by Capitanul burcea,alex */
const { AttachmentBuilder, EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');

const categories = {
  moderation: { label: 'Moderare' },
  utility: { label: 'General' },
  media: { label: 'Media BSH' },
  fun: { label: 'Fun' },
  music: { label: 'Muzica' },
  vc: { label: 'Voice VC' },
  voice: { label: 'Voice' },
  profile: { label: 'Profiluri' },
  community: { label: 'Community' },
  security: { label: 'Securitate' },
  ticketing: { label: 'Ticketing' },
  ai: { label: 'AI' },
};

const modCmds = ['ban', 'unban', 'kick', 'timeout', 'warn', 'clear', 'slowmode', 'lock'];
const utilCmds = ['help', 'ping', 'serverinfo', 'userinfo', 'avatar', 'poll', 'embed', 'invites', 'ticket', 'apply', 'selfroles', 'verify', 'welcome', 'autorole', 'ai', 'jarvisvc', 'template', 'sustinere', 'triggers', 'cameraonly'];
const mediaCmds = ['media'];
const funCmds = ['coinflip', '8ball', 'roll', 'trivia', 'choose'];
const musicCmds = ['play', 'skip', 'stop', 'queue', 'nowplaying', 'pause', 'resume', 'volume', 'loop', 'radio'];

function getCat(command) {
  const name = command.data?.name || command.name;
  if (command.category && categories[command.category]) return command.category;
  if (modCmds.includes(name)) return 'moderation';
  if (mediaCmds.includes(name)) return 'media';
  if (utilCmds.includes(name)) return 'utility';
  if (funCmds.includes(name)) return 'fun';
  if (musicCmds.includes(name)) return 'music';
  if (name.startsWith('vc') || name.startsWith('voice')) return 'vc';
  if (name.startsWith('profile-')) return 'profile';
  if (name.startsWith('community-')) return 'community';
  if (name.startsWith('security-')) return 'security';
  if (name.startsWith('ticket-')) return 'ticketing';
  if (name.startsWith('ai-')) return 'ai';
  return 'utility';
}

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Lista tuturor comenzilor')
    .addBooleanOption((option) =>
      option
        .setName('toate')
        .setDescription('Include lista completa a comenzilor in fisier text')
    ),
  cooldown: 5,
  async execute(interaction, client) {
    const includeAll = interaction.options.getBoolean('toate') ?? true;
    const grouped = {};
    client.commands.forEach((cmd) => {
      const cat = getCat(cmd);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ name: cmd.data.name, desc: cmd.data.description });
    });

    const embed = new EmbedBuilder()
      .setColor(0x00e5ff)
      .setTitle('BSH Bot - Meniu Ajutor')
      .setDescription('Comenzi generale pentru comunitate, media, muzica, Jarvis si administrare. Lista completa este trimisa ca fisier text.')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: `${client.commands.size} comenzi - ${interaction.user.tag}` });

    for (const [cat, info] of Object.entries(categories)) {
      const cmds = grouped[cat];
      if (!cmds?.length) continue;
      const preview = cmds.slice(0, 18).map((cmd) => `\`/${cmd.name}\``).join(' ');
      const suffix = cmds.length > 18 ? ` ... (+${cmds.length - 18})` : '';
      embed.addFields({
        name: `${info.label} (${cmds.length})`,
        value: `${preview}${suffix}`,
        inline: false,
      });
    }

    if (!includeAll) {
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const lines = [];
    lines.push(`Update Phoenix - lista completa comenzi (${client.commands.size})`);
    lines.push(`Generat la: ${new Date().toISOString()}`);
    lines.push('');

    for (const [cat, info] of Object.entries(categories)) {
      const cmds = grouped[cat];
      if (!cmds?.length) continue;
      lines.push(`== ${info.label} (${cmds.length}) ==`);
      for (const cmd of cmds.map((item) => item.name).sort()) lines.push(`/${cmd}`);
      lines.push('');
    }

    const file = new AttachmentBuilder(Buffer.from(lines.join('\n'), 'utf8'), {
      name: 'update-phoenix-help-complete.txt',
    });

    await interaction.reply({ embeds: [embed], files: [file], flags: MessageFlags.Ephemeral });
  },
};
