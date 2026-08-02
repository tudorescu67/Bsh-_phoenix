/* by Capitanul burcea,alex */
const path = require('path');

const requiredPackages = [
  'discord.js',
  '@discordjs/builders',
  '@discordjs/collection',
  '@discordjs/formatters',
  '@discordjs/rest',
  '@discordjs/util',
  '@discordjs/ws',
  '@sapphire/snowflake',
  'discord-api-types/v10',
  'undici',
];

for (const pkg of requiredPackages) {
  require.resolve(pkg);
}

const {
  Client,
  GatewayIntentBits,
  ChannelType,
  Collection,
} = require('discord.js');

const discordRoot = path.dirname(require.resolve('discord.js'));
const { createChannel } = require(path.join(discordRoot, '..', 'src', 'util', 'Channels.js'));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const guild = {
  id: '123456789012345678',
  client,
  channels: { cache: new Collection() },
  threads: { cache: new Collection() },
  roles: { cache: new Collection() },
};

const data = {
  id: '123456789012345679',
  type: ChannelType.GuildText,
  guild_id: guild.id,
  name: 'runtime-check',
  position: 0,
  permission_overwrites: [],
  nsfw: false,
  rate_limit_per_user: 0,
  topic: null,
  last_message_id: null,
  parent_id: null,
};

const channel = createChannel(client, data, guild);
if (!channel || channel.id !== data.id) {
  throw new Error('discord.js channel runtime check failed');
}

client.destroy();
console.log('[OK] discord.js runtime dependencies are complete');
