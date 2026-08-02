/* by Capitanul burcea,alex */
const { EmbedBuilder } = require('discord.js');
const db = require('./database');

async function sendVoiceLog(guild, embed) {
  const config = db.get('log_config', guild.id);
  if (!config) return;

  const channelId = config.channels?.voice || config.channelId;
  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);
  if (channel) {
    await channel.send({ embeds: [embed] }).catch(() => {});
  }
}

module.exports = {
  onVoiceJoin: async (member, channel) => {
    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setDescription(`${member} a **intrat** pe canalul ${channel}`)
      .setTimestamp();
    await sendVoiceLog(member.guild, embed);
  },

  onVoiceLeave: async (member, channel) => {
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setDescription(`${member} a **părăsit** canalul ${channel}`)
      .setTimestamp();
    await sendVoiceLog(member.guild, embed);
  },

  onVoiceMove: async (member, oldChannel, newChannel) => {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setDescription(`${member} s-a **mutat**:\n⬅️ **Din:** ${oldChannel}\n➡️ **În:** ${newChannel}`)
      .setTimestamp();
    await sendVoiceLog(member.guild, embed);
  }
};
