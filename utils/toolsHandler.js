/* by Capitanul burcea,alex */
const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
const { chatWithAI, splitDiscordText } = require('./aiHandler');

async function handleToolsPanel(interaction) {
  const id = interaction.customId;

  if (id === 'panel_tools_weather') {
    const modal = new ModalBuilder().setCustomId('modal_weather').setTitle('Prognoza Meteo');
    modal.addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('city')
        .setLabel('Orasul')
        .setPlaceholder('ex: Bucuresti')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ));
    return interaction.showModal(modal);
  }

  if (id === 'panel_tools_translate') {
    const modal = new ModalBuilder().setCustomId('modal_translate').setTitle('Traducere RO -> EN');
    modal.addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('text')
        .setLabel('Textul de tradus')
        .setPlaceholder('Scrie textul aici...')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(3500)
        .setRequired(true)
    ));
    return interaction.showModal(modal);
  }

  if (id === 'panel_tools_ai') {
    const modal = new ModalBuilder().setCustomId('modal_ai').setTitle('AI Chat');
    modal.addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('prompt')
        .setLabel('Intrebarea ta')
        .setPlaceholder('Scrie ce vrei sa intrebi...')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(3500)
        .setRequired(true)
    ));
    return interaction.showModal(modal);
  }

  if (id === 'panel_tools_bug') {
    const bugCmd = interaction.client.commands.get('bugreport');
    if (bugCmd) return bugCmd.execute(interaction);
  }
}

async function handleToolsModal(interaction) {
  const id = interaction.customId;

  if (id === 'modal_weather') {
    const city = interaction.fields.getTextInputValue('city');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { timeout: 12000 });
      const data = response.data?.current_condition?.[0];
      if (!data) throw new Error('Raspuns meteo invalid.');

      const temp = data.temp_C;
      const desc = data.lang_ro?.[0]?.value || data.weatherDesc?.[0]?.value || 'Necunoscut';

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`Vremea in ${city}`)
        .addFields(
          { name: 'Temperatura', value: `${temp} C`, inline: true },
          { name: 'Descriere', value: desc.slice(0, 1024), inline: true },
          { name: 'Umiditate', value: `${data.humidity}%`, inline: true },
          { name: 'Vant', value: `${data.windspeedKmph} km/h`, inline: true }
        )
        .setFooter({ text: 'phoenixrisen.ro' });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: `Nu am putut gasi vremea pentru acest oras: ${err.message}` });
    }
  }

  if (id === 'modal_translate') {
    const text = interaction.fields.getTextInputValue('text');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const res = await axios.get(`https://api.popcat.xyz/translate?to=en&text=${encodeURIComponent(text)}`, { timeout: 12000 });
      const translated = res.data?.translated || 'Nu am primit traducere.';
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Traducere RO -> EN')
        .addFields(
          { name: 'Original', value: text.slice(0, 1024) },
          { name: 'Tradus', value: translated.slice(0, 1024) }
        )
        .setFooter({ text: 'phoenixrisen.ro' });
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: `Eroare la traducere: ${err.message}` });
    }
  }

  if (id === 'modal_ai') {
    const prompt = interaction.fields.getTextInputValue('prompt');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const response = await chatWithAI('auto', prompt);
    const chunks = splitDiscordText(response, 3500);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('AI Chat')
      .setDescription(`**Intrebare:** ${prompt.slice(0, 900)}\n\n**Raspuns:**\n${chunks[0]}`)
      .setFooter({ text: 'phoenixrisen.ro' });

    await interaction.editReply({ embeds: [embed] });
    for (const chunk of chunks.slice(1, 3)) {
      await interaction.followUp({ content: chunk, flags: MessageFlags.Ephemeral });
    }
  }
}

module.exports = { handleToolsPanel, handleToolsModal };
