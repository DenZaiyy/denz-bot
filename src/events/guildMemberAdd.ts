import { Client, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { getGuildSettings } from '../services/database';

export default async function guildMemberAdd(client: Client, member: GuildMember): Promise<void> {
  const settings = getGuildSettings(member.guild.id);
  if (!settings.welcomeChannelId) return;

  const channel = await client.channels.fetch(settings.welcomeChannelId).catch(() => null) as TextChannel | null;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('🎉 Nouveau membre !')
    .setDescription(
      `Bienvenue sur **${member.guild.name}**, ${member} !\n` +
      `On est heureux de t'avoir parmi nous. 🥳`,
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: '🏷️ Pseudo',       value: member.user.username,                                             inline: true },
      { name: '📅 Compte créé',  value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,        inline: true },
      { name: '👥 Membre n°',    value: `**${member.guild.memberCount.toLocaleString()}**`,                inline: true },
    )
    .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() ?? undefined })
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(err => console.error('[Welcome] Send error:', err));
}
