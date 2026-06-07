import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Track, LoopMode } from '../../types';

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

const LOOP_LABEL: Record<LoopMode, string> = {
  none: 'Désactivée',
  track: 'Piste',
  queue: 'File',
};

function formatQuality(track: Track): string {
  const quality = track.audioQuality;
  if (!quality) return 'Meilleure disponible';

  const details = [
    quality.codec?.toUpperCase(),
    quality.bitrateKbps ? `${Math.round(quality.bitrateKbps)} kb/s` : null,
    quality.sampleRateHz ? `${Math.round(quality.sampleRateHz / 1000)} kHz` : null,
  ].filter(Boolean);

  return details.join(' • ') || 'Meilleure disponible';
}

export function buildNowPlayingEmbed(
  track: Track,
  isPaused: boolean,
  nextTrack: Track | null,
  volume: number,
  loopMode: LoopMode = 'none',
  shuffleEnabled = false,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(isPaused ? 0x99aab5 : 0x5865f2)
    .setAuthor({ name: isPaused ? '⏸ En pause' : '▶ Lecture en cours' })
    .setTitle(track.title)
    .setURL(track.url)
    .addFields(
      { name: 'Durée', value: fmt(track.durationMs), inline: true },
      { name: 'Volume', value: `${Math.round(volume * 100)}%`, inline: true },
      { name: 'Qualité', value: formatQuality(track), inline: true },
      { name: 'Demandé par', value: track.requestedBy, inline: true },
      { name: 'Boucle', value: LOOP_LABEL[loopMode], inline: true },
      { name: 'Shuffle', value: shuffleEnabled ? 'Activé' : 'Désactivé', inline: true },
      { name: 'À suivre', value: nextTrack ? `[${nextTrack.title}](${nextTrack.url})` : 'Fin de la file', inline: false },
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
