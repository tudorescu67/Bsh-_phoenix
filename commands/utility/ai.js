/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { chatWithAI, splitDiscordText } = require('../../utils/aiHandler');
const { askJarvis } = require('../../utils/jarvisClient');

const providerChoices = [
  { name: 'Auto (OpenAI -> Ollama -> Browser)', value: 'auto' },
  { name: 'OpenAI API', value: 'openai' },
  { name: 'Ollama Local', value: 'ollama' },
  { name: 'DuckDuckGo AI Browser', value: 'duckduckgo' },
  { name: 'Claude via DuckDuckGo', value: 'claude' },
  { name: 'Gemini via DuckDuckGo', value: 'gemini' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Intreaba inteligenta artificiala')
    .addSubcommand(subcommand =>
      subcommand
        .setName('jarvis')
        .setDescription('Intreaba Jarvis prin API-ul BSH')
        .addStringOption(option =>
          option
            .setName('mesaj')
            .setDescription('Ce vrei sa intrebi?')
            .setRequired(true)
            .setMaxLength(1200)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('chat')
        .setDescription('Foloseste providerii AI vechi')
        .addStringOption(option =>
          option
            .setName('provider')
            .setDescription('Alege modelul AI')
            .setRequired(true)
            .addChoices(...providerChoices)
        )
        .addStringOption(option =>
          option
            .setName('mesaj')
            .setDescription('Ce vrei sa intrebi?')
            .setRequired(true)
            .setMaxLength(4000)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand(false) || 'chat';
    const message = interaction.options.getString('mesaj');

    await interaction.deferReply();

    if (subcommand === 'jarvis') {
      try {
        const result = await askJarvis(message, interaction);
        const chunks = splitDiscordText(result.answer || 'Jarvis nu a trimis un raspuns.', 3500);
        const embed = new EmbedBuilder()
          .setColor(result.ok ? 0x5865F2 : 0xFEE75C)
          .setTitle('Jarvis')
          .setDescription(`**Intrebare:** ${message.slice(0, 900)}\n\n**Raspuns:**\n${chunks[0]}`)
          .setFooter({ text: `Jarvis API${result.latencyMs ? ` - ${result.latencyMs}ms` : ''}` });

        await interaction.editReply({ embeds: [embed] });
        for (const chunk of chunks.slice(1, 4)) {
          await interaction.followUp({ content: chunk });
        }
        return;
      } catch (err) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFEE75C)
              .setTitle('Jarvis indisponibil')
              .setDescription('Jarvis API nu raspunde acum. Incearca din nou peste putin timp.'),
          ],
        });
        return;
      }
    }

    const provider = interaction.options.getString('provider') || 'auto';
    const response = await chatWithAI(provider, message);
    const chunks = splitDiscordText(response, 3500);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`AI - ${provider.toUpperCase()}`)
      .setDescription(`**Intrebare:** ${message.slice(0, 900)}\n\n**Raspuns:**\n${chunks[0]}`)
      .setFooter({ text: 'phoenixrisen.ro - AI Integration' });

    await interaction.editReply({ embeds: [embed] });

    for (const chunk of chunks.slice(1, 4)) {
      await interaction.followUp({ content: chunk });
    }
  }
};
