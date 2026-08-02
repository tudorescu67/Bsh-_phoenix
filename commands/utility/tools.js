/* by Capitanul burcea,alex */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tools')
    .setDescription('Comenzi utile Phoenix Risen')
    .addSubcommand(s => s.setName('weather').setDescription('Află vremea într-un oraș')
      .addStringOption(o => o.setName('oras').setDescription('Numele orașului').setRequired(true)))
    .addSubcommand(s => s.setName('translate').setDescription('Tradu un text (RO -> EN)')
      .addStringOption(o => o.setName('text').setDescription('Textul de tradus').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'weather') {
      const city = interaction.options.getString('oras');
      await interaction.deferReply();
      
      try {
        // Folosim un API public gratuit pentru demo (wttr.in)
        const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
        const data = response.data.current_condition[0];
        const temp = data.temp_C;
        const desc = data.lang_ro ? data.lang_ro[0].value : data.weatherDesc[0].value;

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`🌡️ Vremea în ${city}`)
          .addFields(
            { name: 'Temperatura', value: `${temp}°C`, inline: true },
            { name: 'Descriere', value: desc, inline: true },
            { name: 'Umiditate', value: `${data.humidity}%`, inline: true }
          )
          .setFooter({ text: 'phoenixrisen.ro' });

        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        await interaction.editReply({ content: '❌ Nu am putut găsi informații pentru acest oraș.' });
      }
    }

    if (sub === 'translate') {
      const text = interaction.options.getString('text');
      await interaction.deferReply();

      try {
        // Folosim un API de traducere gratuit
        const res = await axios.get(`https://api.popcat.xyz/translate?to=en&text=${encodeURIComponent(text)}`);
        
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('🔤 Traducere RO -> EN')
          .addFields(
            { name: 'Original', value: text },
            { name: 'Tradus', value: res.data.translated }
          )
          .setFooter({ text: 'phoenixrisen.ro' });

        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        await interaction.editReply({ content: '❌ Eroare la traducere.' });
      }
    }
  }
};
