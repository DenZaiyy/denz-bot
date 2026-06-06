import { AudioPlayer, VoiceConnection, createAudioPlayer, AudioPlayerStatus } from '@discordjs/voice';
import type { Message, TextChannel, NewsChannel, ThreadChannel } from 'discord.js';
import type { Track, LoopMode } from '../../types';

export type SendableChannel = TextChannel | NewsChannel | ThreadChannel;

export class GuildQueue {
  readonly player: AudioPlayer;
  readonly connection: VoiceConnection;
  tracks: Track[] = [];
  current: Track | null = null;
  volume = 1;
  isPaused = false;
  loopMode: LoopMode = 'none';
  textChannel: SendableChannel | null = null;
  nowPlayingMessage: Message | null = null;
  private progressInterval: NodeJS.Timeout | null = null;

  constructor(connection: VoiceConnection, onIdle: () => void) {
    this.connection = connection;
    this.player = createAudioPlayer();
    connection.subscribe(this.player);
    this.player.on(AudioPlayerStatus.Idle, onIdle);
    this.player.on('error', err => {
      console.error('[AudioPlayer]', err.message);
      onIdle();
    });
  }

  startProgressUpdates(fn: () => void): void {
    this.stopProgressUpdates();
    this.progressInterval = setInterval(fn, 15_000);
  }

  stopProgressUpdates(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  get isEmpty(): boolean {
    return this.tracks.length === 0 && !this.current;
  }

  destroy(): void {
    this.stopProgressUpdates();
    this.player.stop(true);
    this.connection.destroy();
  }
}
