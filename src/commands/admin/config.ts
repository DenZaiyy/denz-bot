import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
  GuildMember,
  TextChannel,
} from 'discord.js';
import type { Command } from '../../types';
import { getGuildSettings, saveGuildSettings } from '../../services/database';
import { TwitchService } from '../../services/twitch';
import { buildStreamEmbed } from '../../listeners/twitchStreamOnline';

function isAdmin(interaction: ChatInputCommandInteraction): boolean {
  const member = interaction.member as GuildMember;
  return (
    interaction.guild?.ownerId === interaction.user.id ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configuration du bot pour ce serveur')
    .addSubcommand(sub =>
      sub
        .setName('setchannel')
        .setDescription('Définit le salon pour les notifications Twitch')
        .addChannelOption(opt =>
          opt
            .setName('salon')
            .setDescription('Salon textuel pour les notifications')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('addstreamer')
        .setDescription('Ajoute un streamer Twitch à surveiller')
        .addStringOption(opt =>
          opt.setName('login').setDescription('Nom Twitch du streamer (ex: pokimane)').setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('removestreamer')
        .setDescription('Retire un streamer de la surveillance')
        .addStringOption(opt =>
          opt.setName('login').setDescription('Nom Twitch du streamer').setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('Affiche la configuration actuelle du serveur'),
    )
    .addSubcommand(sub =>
      sub
        .setName('setwelcome')
        .setDescription('Définit le salon pour les messages de bienvenue/départ (vide = désactiver)')
        .addChannelOption(opt =>
          opt
            .setName('salon')
            .setDescription('Salon textuel (laisser vide pour désactiver)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('testnotif')
        .setDescription('Envoyer un embed de test dans le salon de notifications configuré')
        .addStringOption(opt =>
          opt.setName('login').setDescription('Nom Twitch du streamer à simuler').setRequired(true),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!isAdmin(interaction)) {
      await interaction.reply({ content: '🚫 Cette commande est réservée aux administrateurs.', ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const settings = getGuildSettings(guildId);

    switch (sub) {
      case 'setchannel': {
        const channel = interaction.options.getChannel('salon', true);
        settings.notificationChannelId = channel.id;
        saveGuildSettings(settings);
        await interaction.reply(`✅ Salon de notifications défini sur <#${channel.id}>`);
        break;
      }

      case 'addstreamer': {
        const login = interaction.options.getString('login', true).toLowerCase().trim();
        if (settings.trackedStreamers.includes(login)) {
          await interaction.reply({ content: `\`${login}\` est déjà dans la liste.`, ephemeral: true });
          return;
        }
        settings.trackedStreamers.push(login);
        saveGuildSettings(settings);
        await interaction.reply(`✅ **${login}** ajouté — le bot enverra une notif dès qu'il passe en live.`);
        break;
      }

      case 'removestreamer': {
        const login = interaction.options.getString('login', true).toLowerCase().trim();
        const idx = settings.trackedStreamers.indexOf(login);
        if (idx === -1) {
          await interaction.reply({ content: `\`${login}\` n'est pas dans la liste.`, ephemeral: true });
          return;
        }
        settings.trackedStreamers.splice(idx, 1);
        saveGuildSettings(settings);
        await interaction.reply(`✅ **${login}** retiré de la surveillance.`);
        break;
      }

      case 'list': {
        const channelMention = settings.notificationChannelId
          ? `<#${settings.notificationChannelId}>`
          : '*Non défini*';
        const streamerList = settings.trackedStreamers.length > 0
          ? settings.trackedStreamers.map(s => `\`${s}\``).join(', ')
          : '*Aucun*';

        const welcomeMention = settings.welcomeChannelId
          ? `<#${settings.welcomeChannelId}>`
          : '*Non défini*';

        const embed = new EmbedBuilder()
          .setTitle('⚙️ Configuration du serveur')
          .setColor(0x5865f2)
          .addFields(
            { name: '📢 Salon de notifications Twitch', value: channelMention },
            { name: '👋 Salon de bienvenue/départ',    value: welcomeMention },
            { name: `📺 Streamers surveillés (${settings.trackedStreamers.length})`, value: streamerList },
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        break;
      }

      case 'setwelcome': {
        const channel = interaction.options.getChannel('salon');
        if (channel) {
          settings.welcomeChannelId = channel.id;
          saveGuildSettings(settings);
          await interaction.reply(`✅ Salon de bienvenue/départ défini sur <#${channel.id}>`);
        } else {
          settings.welcomeChannelId = null;
          saveGuildSettings(settings);
          await interaction.reply('✅ Messages de bienvenue/départ désactivés.');
        }
        break;
      }

      case 'testnotif': {
        if (!settings.notificationChannelId) {
          await interaction.reply({
            content: '❌ Aucun salon configuré. Utilise `/config setchannel` d\'abord.',
            ephemeral: true,
          });
          return;
        }

        const login = interaction.options.getString('login', true).toLowerCase().trim();
        await interaction.deferReply({ ephemeral: true });

        // Tenter de récupérer la vraie photo de profil Twitch
        let profilePictureUrl: string | undefined;
        try {
          const user = await TwitchService.instance?.getUserByName(login);
          profilePictureUrl = user?.profilePictureUrl;
        } catch {}

        try {
          const channel = await interaction.client.channels.fetch(settings.notificationChannelId) as TextChannel;
          const embed = buildStreamEmbed(interaction.client, {
            streamerName: login,
            streamerLogin: login,
            title: '🧪 Ceci est une notification de test !',
            gameName: 'Test',
            viewers: 42,
            thumbnailUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-1280x720.jpg?t=${Date.now()}`,
            profilePictureUrl,
          });
          await channel.send({ content: '`[TEST]`', embeds: [embed] });
          await interaction.editReply(`✅ Notification de test envoyée dans <#${settings.notificationChannelId}>.`);
        } catch (err) {
          console.error('[testnotif]', err);
          await interaction.editReply('❌ Impossible d\'envoyer. Vérifie que le bot a accès au salon configuré.');
        }
        break;
      }
    }
  },
};

export default command;
