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
  thumbnail?: string;
  entries?: YtdlpVideo[];
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input);
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
