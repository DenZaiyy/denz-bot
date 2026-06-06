import { Client, GuildMember, PartialGuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { getGuildSettings } from '../services/database';

function formatDuration(ms: number): string {
  const days  = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins  = Math.floor((ms % 3_600_000) / 60_000);
  if (days  > 0) return `${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`;
  if (mins  > 0) return `${mins} minute${mins > 1 ? 's' : ''}`;
  return 'Moins d\'une minute';
}

export default async function guildMemberRemove(
  client: Client,
  member: GuildMember | PartialGuildMember,
): Promise<void> {
  const settings = getGuildSettings(member.guild.id);
  if (!settings.welcomeChannelId) return;

  const channel = await client.channels.fetch(settings.welcomeChannelId).catch(() => null) as TextChannel | null;
  if (!channel) return;

  const username = member.user?.username ?? 'Membre inconnu';
  const avatar   = member.user?.displayAvatarURL({ size: 256 }) ?? null;

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('💨 Un membre est parti')
    .setDescription(`**${username}** a quitté le serveur.`)
    .setThumbnail(avatar)
    .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() ?? undefined })
    .setTimestamp();

  if (member.joinedTimestamp) {
    embed.addFields(
      { name: '📥 Avait rejoint',  value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,   inline: true },
      { name: '⏱️ Temps passé',    value: formatDuration(Date.now() - member.joinedTimestamp),     inline: true },
    );
  }

  await channel.send({ embeds: [embed] }).catch(err => console.error('[Leave] Send error:', err));
}
