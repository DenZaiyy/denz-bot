import { spawn } from 'child_process';
import { createAudioResource, StreamType } from '@discordjs/voice';
import { isSpotifyUrl, resolveSpotifyTrack } from './spotify';
import type { Track } from '../types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ytdlp = require('youtube-dl-exec') as {
  youtubeDl: (url: string, flags?: Record<string, unknown>) => Promise<unknown>;
  constants: { YOUTUBE_DL_PATH: string };
};

const BIN = ytdlp.constants.YOUTUBE_DL_PATH;

interface YtdlpVideo {
  title: string;
  duration: number;
  webpage_url: string;
  id?: string;
  thumbnail?: string;
  entries?: YtdlpVideo[];
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input);
}

export function isPlaylistUrl(input: string): boolean {
  if (!isUrl(input)) return false;
  try {
    const u = new URL(input);
    if (u.hostname === 'youtu.be') return false; // toujours une vidéo unique
    return u.searchParams.has('list') && !u.searchParams.has('v');
  } catch {
    return false;
  }
}

export async function resolvePlaylist(url: string): Promise<Array<{ url: string; title: string; durationMs: number; thumbnail?: string }>> {
  const raw = await ytdlp.youtubeDl(url, {
    dumpSingleJson: true,
    noWarnings: true,
    quiet: true,
    flatPlaylist: true,
  }) as unknown as YtdlpVideo;

  if (!raw.entries?.length) return [];

  return raw.entries
    .map(e => {
      const videoUrl = e.webpage_url ?? (e.id ? `https://www.youtube.com/watch?v=${e.id}` : null);
      if (!videoUrl) return null;
      return {
        url: videoUrl,
        title: e.title ?? 'Sans titre',
        durationMs: (e.duration ?? 0) * 1000,
        thumbnail: e.thumbnail,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
}

export async function resolve(input: string): Promise<{
  url: string;
  title: string;
  durationMs: number;
  thumbnail?: string;
} | null> {
  // Spotify URLs: scrape OG tags → build YouTube search query
  let spotifyThumbnail: string | undefined;
  if (isSpotifyUrl(input)) {
    const spotify = await resolveSpotifyTrack(input);
    spotifyThumbnail = spotify.thumbnail;
    input = `ytsearch1:${spotify.query}`;
  } else {
    // Plain YouTube URL or search text
    input = isUrl(input) ? input : `ytsearch1:${input}`;
  }

  const raw = await ytdlp.youtubeDl(input, {
    dumpSingleJson: true,
    noWarnings: true,
    noPlaylist: true,
    quiet: true,
  }) as unknown as YtdlpVideo;

  const video = raw.entries?.[0] ?? raw;
  if (!video?.webpage_url) return null;

  return {
    url: video.webpage_url,
    title: video.title,
    durationMs: (video.duration ?? 0) * 1000,
    thumbnail: spotifyThumbnail ?? video.thumbnail,
  };
}

export function createStream(track: Track, volume = 1) {
  const proc = spawn(BIN, [
    track.url,
    '-f', 'bestaudio',
    '-o', '-',
    '--quiet',
    '--no-warnings',
  ]);
  const resource = createAudioResource(proc.stdout, {
    inputType: StreamType.Arbitrary,
    metadata: track,
    inlineVolume: true,
  });
  resource.volume?.setVolume(volume);
  return resource;
}
