import { joinVoiceChannel, VoiceConnectionStatus, entersState, AudioPlayerStatus, AudioPlayerPlayingState } from '@discordjs/voice';
import type { VoiceChannel, GuildMember } from 'discord.js';
import type { SendableChannel } from './GuildQueue';
import { GuildQueue } from './GuildQueue';
import { createStream, resolveAudioQuality } from '../youtube';
import { getGuildSettings, saveGuildSettings } from '../database';
import { buildNowPlayingEmbed, buildMusicButtons } from './nowPlayingEmbed';
import type { Track, LoopMode } from '../../types';

const IDLE_DISCONNECT_MS = 5 * 60 * 1000;

class MusicService {
  private queues = new Map<string, GuildQueue>();

  private async ensureAudioQuality(track: Track): Promise<void> {
    if (track.audioQuality) return;
    try {
      track.audioQuality = await resolveAudioQuality(track.url);
    } catch (err) {
      console.warn(`[AudioQuality] Impossible d'analyser "${track.title}":`, err);
    }
  }

  private getPlaybackMs(queue: GuildQueue): number {
    const state = queue.player.state;
    if (state.status === AudioPlayerStatus.Playing || state.status === AudioPlayerStatus.Paused) {
      return (state as AudioPlayerPlayingState).resource.playbackDuration;
    }
    return 0;
  }

  async updateNowPlayingEmbed(guildId: string): Promise<void> {
    const queue = this.queues.get(guildId);
    if (!queue?.current || !queue.nowPlayingMessage) return;
    try {
      await queue.nowPlayingMessage.edit({
        embeds: [buildNowPlayingEmbed(queue.current, queue.isPaused, this.getPlaybackMs(queue), queue.tracks.length, queue.volume, queue.loopMode)],
        components: [buildMusicButtons(queue.isPaused)],
      });
    } catch {
      queue.nowPlayingMessage = null;
      queue.stopProgressUpdates();
    }
  }

  private async sendNowPlayingEmbed(guildId: string): Promise<void> {
    const queue = this.queues.get(guildId);
    if (!queue?.current || !queue.textChannel) return;

    try { await queue.nowPlayingMessage?.delete(); } catch {}

    try {
      queue.nowPlayingMessage = await queue.textChannel.send({
        embeds: [buildNowPlayingEmbed(queue.current, false, 0, queue.tracks.length, queue.volume, queue.loopMode)],
        components: [buildMusicButtons(false)],
      });
      queue.startProgressUpdates(() => void this.updateNowPlayingEmbed(guildId));
    } catch (err) {
      console.error('[NowPlaying] Failed to send embed:', err);
    }
  }

  private async playNext(guildId: string): Promise<void> {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    queue.stopProgressUpdates();

    // Loop track: rejouer la chanson actuelle
    if (queue.loopMode === 'track' && queue.current) {
      const track = queue.current;
      queue.isPaused = false;
      try {
        await this.ensureAudioQuality(track);
        queue.player.play(createStream(track, queue.volume));
        await this.updateNowPlayingEmbed(guildId);
      } catch (err) {
        console.error(`[MusicService] Loop stream error for "${track.title}":`, err);
        queue.loopMode = 'none';
        await this.playNext(guildId);
      }
      return;
    }

    // Loop queue: remettre la chanson actuelle en fin de file
    if (queue.loopMode === 'queue' && queue.current) {
      queue.tracks.push(queue.current);
    }

    const next = queue.tracks.shift();

    if (!next) {
      if (queue.nowPlayingMessage) {
        try { await queue.nowPlayingMessage.edit({ components: [] }); } catch {}
        queue.nowPlayingMessage = null;
      }
      queue.current = null;
      setTimeout(() => {
        if (queue.isEmpty) { queue.destroy(); this.queues.delete(guildId); }
      }, IDLE_DISCONNECT_MS);
      return;
    }

    queue.current = next;
    queue.isPaused = false;
    try {
      await this.ensureAudioQuality(next);
      queue.player.play(createStream(next, queue.volume));
      await this.sendNowPlayingEmbed(guildId);
    } catch (err) {
      console.error(`[MusicService] Stream error for "${next.title}":`, err);
      await this.playNext(guildId);
    }
  }

  private async getOrCreateQueue(member: GuildMember): Promise<GuildQueue> {
    const existing = this.queues.get(member.guild.id);
    if (existing) return existing;

    const channel = member.voice.channel as VoiceChannel;
    console.log(
      `[AudioQuality] Salon "${channel.name}" (${member.guild.name}): `
      + `bitrate Discord=${Math.round(channel.bitrate / 1000)} kb/s`,
    );
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: member.guild.id,
      adapterCreator: member.guild.voiceAdapterCreator,
    });
    await entersState(connection, VoiceConnectionStatus.Ready, 10_000);

    const queue = new GuildQueue(connection, () => void this.playNext(member.guild.id));
    queue.volume = getGuildSettings(member.guild.id).volumePercent / 100;
    this.queues.set(member.guild.id, queue);
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        // Wait briefly — if Discord is just reconnecting, stay alive
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        // Permanent disconnect: clean up fully
        queue.destroy();
        this.queues.delete(member.guild.id);
      }
    });
    return queue;
  }

  async enqueue(member: GuildMember, track: Track, textChannel: SendableChannel): Promise<{ position: number; wasPlaying: boolean }> {
    if (!member.voice.channelId) throw new Error('You must be in a voice channel.');
    const queue = await this.getOrCreateQueue(member);
    queue.textChannel = textChannel;
    const wasPlaying = !!queue.current;
    queue.tracks.push(track);
    if (!queue.current) await this.playNext(member.guild.id);
    return { position: queue.tracks.length, wasPlaying };
  }

  async enqueueMany(member: GuildMember, tracks: Track[], textChannel: SendableChannel): Promise<{ total: number; wasPlaying: boolean }> {
    if (!member.voice.channelId) throw new Error('You must be in a voice channel.');
    const queue = await this.getOrCreateQueue(member);
    queue.textChannel = textChannel;
    const wasPlaying = !!queue.current;
    queue.tracks.push(...tracks);
    if (!queue.current) await this.playNext(member.guild.id);
    return { total: tracks.length, wasPlaying };
  }

  async togglePause(guildId: string): Promise<boolean | null> {
    const queue = this.queues.get(guildId);
    if (!queue?.current) return null;
    if (queue.isPaused) {
      queue.player.unpause();
      queue.isPaused = false;
    } else {
      queue.player.pause();
      queue.isPaused = true;
    }
    await this.updateNowPlayingEmbed(guildId);
    return queue.isPaused;
  }

  toggleLoop(guildId: string): LoopMode | null {
    const queue = this.queues.get(guildId);
    if (!queue?.current) return null;
    const modes: LoopMode[] = ['none', 'track', 'queue'];
    queue.loopMode = modes[(modes.indexOf(queue.loopMode) + 1) % modes.length];
    void this.updateNowPlayingEmbed(guildId);
    return queue.loopMode;
  }

  shuffleQueue(guildId: string): number {
    const queue = this.queues.get(guildId);
    if (!queue || queue.tracks.length < 2) return 0;
    for (let i = queue.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j]!, queue.tracks[i]!];
    }
    return queue.tracks.length;
  }

  skip(guildId: string): Track | null {
    const queue = this.queues.get(guildId);
    if (!queue?.current) return null;
    const skipped = queue.current;
    queue.player.stop();
    return skipped;
  }

  stop(guildId: string): void {
    const queue = this.queues.get(guildId);
    if (!queue) return;
    if (queue.nowPlayingMessage) {
      queue.nowPlayingMessage.edit({ components: [] }).catch(() => {});
      queue.nowPlayingMessage = null;
    }
    queue.tracks = [];
    queue.current = null;
    queue.destroy();
    this.queues.delete(guildId);
  }

  setVolume(guildId: string, percent: number): void {
    const settings = getGuildSettings(guildId);
    settings.volumePercent = percent;
    saveGuildSettings(settings);

    const queue = this.queues.get(guildId);
    if (!queue) return;
    queue.volume = percent / 100;
    if (queue.player.state.status === AudioPlayerStatus.Playing) {
      (queue.player.state as AudioPlayerPlayingState).resource.volume?.setVolume(queue.volume);
    }
    void this.updateNowPlayingEmbed(guildId);
  }

  getVolume(guildId: string): number {
    const queue = this.queues.get(guildId);
    return queue
      ? Math.round(queue.volume * 100)
      : getGuildSettings(guildId).volumePercent;
  }

  getQueue(guildId: string): { current: Track | null; upcoming: Track[] } {
    const queue = this.queues.get(guildId);
    return { current: queue?.current ?? null, upcoming: [...(queue?.tracks ?? [])] };
  }
}

export const musicService = new MusicService();
