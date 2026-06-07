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
  shuffleEnabled = false;
  textChannel: SendableChannel | null = null;
  nowPlayingMessage: Message | null = null;
  sessionMessages = new Set<Message>();
  idleDisconnectTimer: NodeJS.Timeout | null = null;

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

  get isEmpty(): boolean {
    return this.tracks.length === 0 && !this.current;
  }

  cancelIdleDisconnect(): void {
    if (this.idleDisconnectTimer) {
      clearTimeout(this.idleDisconnectTimer);
      this.idleDisconnectTimer = null;
    }
  }

  destroy(): void {
    this.cancelIdleDisconnect();
    this.player.stop(true);
    this.connection.destroy();
  }
}
