import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import type { HelixStream } from '@twurple/api';
import type { GuildSettings } from '../types';

export interface StreamEmbedData {
  streamerName: string;
  streamerLogin: string;
  title: string;
  gameName: string;
  viewers: number;
  thumbnailUrl: string;
  profilePictureUrl?: string;
}

export function buildStreamEmbed(discord: Client, data: StreamEmbedData): EmbedBuilder {
  const twitchUrl = `https://twitch.tv/${data.streamerLogin}`;
  return new EmbedBuilder()
    .setColor(0xffb800)
    .setAuthor({
      name: discord.user?.username ?? 'Bot',
      iconURL: discord.user?.displayAvatarURL(),
    })
    .setTitle('Twitch Live - ON')
    .setURL(twitchUrl)
    .setThumbnail(data.profilePictureUrl ?? null)
    .setDescription(
      `🚨 Hey les amies ! 🚨\n\n` +
      `Le streamer **${data.streamerName}** a lancé son live sur twitch !\n\n` +
      `N'hésite pas à lui rendre visite ici :\n${twitchUrl}`,
    )
    .addFields(
      { name: 'Titre:', value: data.title || 'Sans titre' },
      { name: 'Catégorie:', value: data.gameName || 'Inconnue', inline: true },
      { name: 'Viewers:', value: data.viewers.toLocaleString(), inline: true },
    )
    .setImage(data.thumbnailUrl)
    .setTimestamp();
}

export async function notifyStreamOnline(
  discord: Client,
  guilds: GuildSettings[],
  streamerLogin: string,
  stream: HelixStream,
  profilePictureUrl?: string,
): Promise<void> {
  const embed = buildStreamEmbed(discord, {
    streamerName: stream.userName,
    streamerLogin,
    title: stream.title,
    gameName: stream.gameName,
    viewers: stream.viewers,
    thumbnailUrl: stream.getThumbnailUrl(1280, 720) + `?t=${Date.now()}`,
    profilePictureUrl,
  });

  const loginLower = streamerLogin.toLowerCase();

  for (const guild of guilds) {
    if (!guild.trackedStreamers.map(s => s.toLowerCase()).includes(loginLower)) continue;
    if (!guild.notificationChannelId) continue;
    try {
      const channel = (await discord.channels.fetch(guild.notificationChannelId)) as TextChannel | null;
      await channel?.send({ content: '@everyone', embeds: [embed] });
    } catch (err) {
      console.error(`[Twitch] Failed to notify guild ${guild.guildId}:`, err);
    }
  }
}
