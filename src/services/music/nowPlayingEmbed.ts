import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Track, LoopMode } from '../../types';

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function bar(current: number, total: number, len = 22): string {
  if (!total) return '░'.repeat(len);
  const filled = Math.min(len, Math.round((current / total) * len));
  return '█'.repeat(filled) + '░'.repeat(len - filled);
}

const LOOP_ICON: Record<LoopMode, string> = {
  none: '',
  track: ' 🔂',
  queue: ' 🔁',
};

export function buildNowPlayingEmbed(
  track: Track,
  isPaused: boolean,
  playbackMs: number,
  upcomingCount: number,
  volume: number,
  loopMode: LoopMode = 'none',
): EmbedBuilder {
  const icon = isPaused ? '⏸' : '▶';
  return new EmbedBuilder()
    .setColor(isPaused ? 0x99aab5 : 0x5865f2)
    .setTitle(track.title)
    .setURL(track.url)
    .setDescription(`${icon}${LOOP_ICON[loopMode]}  \`${bar(playbackMs, track.durationMs)}\`  \`${fmt(playbackMs)} / ${fmt(track.durationMs)}\``)
    .addFields(
      { name: 'Demandé par', value: track.requestedBy, inline: true },
      { name: 'Volume', value: `${Math.round(volume * 100)}%`, inline: true },
      { name: "File d'attente", value: upcomingCount > 0 ? `${upcomingCount} chanson(s)` : 'Vide', inline: true },
    )
    .setThumbnail(track.thumbnail ?? null);
}

export function buildMusicButtons(isPaused: boolean): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('music_pause_resume')
      .setLabel(isPaused ? '▶ Reprendre' : '⏸ Pause')
      .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music_skip')
      .setLabel('⏭ Skip')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('music_stop')
      .setLabel('⏹ Stop')
      .setStyle(ButtonStyle.Danger),
  );
}
