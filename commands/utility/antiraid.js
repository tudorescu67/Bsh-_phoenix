/* by Capitanul burcea,alex */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../utils/database');
const { recordAction } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configureaza sistemul Anti-Raid si Anti-Nuke')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName('config')
        .setDescription('Configureaza setarile Anti-Raid')
        .addBooleanOption((o) => o.setName('activat').setDescription('Activeaza/Dezactiveaza Anti-Raid').setRequired(true))
        .addIntegerOption((o) => o.setName('limita').setDescription('Numar maxim de join-uri').setRequired(false))
        .addIntegerOption((o) => o.setName('fereastra').setDescription('Fereastra de timp in secunde').setRequired(false))
        .addIntegerOption((o) => o.setName('varsta_min').setDescription('Varsta minima cont in minute').setRequired(false))
        .addStringOption((o) => o.setName('actiune').setDescription('Actiunea luata').addChoices(
          { name: 'Kick', value: 'kick' },
          { name: 'Ban', value: 'ban' },
          { name: 'Doar alerta', value: 'alert' },
        ).setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub.setName('lockdown')
        .setDescription('Blocheaza/Deblocheaza toate canalele text.')
        .addBooleanOption((opt) => opt.setName('state').setDescription('True pentru blocare, False pentru deblocare').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName('nuke')
        .setDescription('Configureaza protectia Anti-Nuke')
        .addBooleanOption((o) => o.setName('activat').setDescription('Activeaza Anti-Nuke').setRequired(true))
        .addIntegerOption((o) => o.setName('limita').setDescription('Limita actiuni in fereastra').setRequired(false))
        .addIntegerOption((o) => o.setName('fereastra').setDescription('Fereastra in secunde').setRequired(false))
        .addStringOption((o) => o.setName('actiune').setDescription('Sanctiune cand se declanseaza').addChoices(
          { name: 'Scoate rolurile', value: 'remove_roles' },
          { name: 'Timeout 10 minute', value: 'timeout' },
          { name: 'Kick', value: 'kick' },
          { name: 'Ban', value: 'ban' },
          { name: 'Doar alerta', value: 'alert' },
        ).setRequired(false))
        .addRoleOption((o) => o.setName('rol_protectie').setDescription('Rol care ocoleste Anti-Nuke').setRequired(false)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'config') {
      const enabled = interaction.options.getBoolean('activat');
      const limit = interaction.options.getInteger('limita') ?? 5;
      const windowMs = (interaction.options.getInteger('fereastra') ?? 10) * 1000;
      const minAge = interaction.options.getInteger('varsta_min') ?? 1440;
      const action = interaction.options.getString('actiune') ?? 'kick';

      const cfg = { enabled, limit, window: windowMs, minAge, action };
      db.set('antiraid', interaction.guild.id, cfg);
      await recordAction(interaction.guild, {
        action: 'antiraid.config',
        actor: interaction.user,
        metadata: cfg,
      });

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x00ff00 : 0xff0000)
        .setTitle('Configuratie Anti-Raid')
        .addFields(
          { name: 'Status', value: enabled ? 'Activat' : 'Dezactivat', inline: true },
          { name: 'Limita join', value: `${limit} useri / ${windowMs / 1000}s`, inline: true },
          { name: 'Varsta minima cont', value: `${minAge} minute`, inline: true },
          { name: 'Actiune', value: action.toUpperCase(), inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'nuke') {
      const enabled = interaction.options.getBoolean('activat');
      const limit = interaction.options.getInteger('limita') ?? 3;
      const windowMs = (interaction.options.getInteger('fereastra') ?? 60) * 1000;
      const action = interaction.options.getString('actiune') ?? 'remove_roles';
      const bypassRole = interaction.options.getRole('rol_protectie');
      const cfg = {
        nuke: enabled,
        limit,
        windowMs,
        action,
        bypassRoleId: bypassRole?.id || null,
      };

      db.set('antiraid_config', interaction.guild.id, cfg);
      await recordAction(interaction.guild, {
        action: 'antiraid.nuke-config',
        actor: interaction.user,
        metadata: cfg,
      });

      return interaction.reply({
        content: `Anti-Nuke: **${enabled ? 'ACTIVAT' : 'DEZACTIVAT'}** | limita ${limit}/${windowMs / 1000}s | actiune ${action}${bypassRole ? ` | bypass ${bypassRole}` : ''}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'lockdown') {
      const state = interaction.options.getBoolean('state');
      await interaction.deferReply();

      const channels = interaction.guild.channels.cache.filter((channel) => channel.type === 0);
      let count = 0;

      for (const [, channel] of channels) {
        try {
          await channel.permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: state ? false : null,
          });
          count += 1;
        } catch {}
      }

      await recordAction(interaction.guild, {
        action: state ? 'lockdown.enable' : 'lockdown.disable',
        actor: interaction.user,
        metadata: { channels: count },
      });

      const embed = new EmbedBuilder()
        .setColor(state ? 0xff0000 : 0x00ff00)
        .setTitle(state ? 'LOCKDOWN ACTIVAT' : 'LOCKDOWN DEZACTIVAT')
        .setDescription(state
          ? `Toate canalele text (${count}) au fost blocate pentru membrii de rand.`
          : `Toate canalele text (${count}) au fost deblocate.`)
        .setFooter({ text: 'phoenixrisen.ro - Emergency System' });

      return interaction.editReply({ embeds: [embed] });
    }
  },
};
