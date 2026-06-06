import { AppTokenAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import type { HelixUser } from '@twurple/api';
import type { Client } from 'discord.js';
import { config } from '../config';
import { getAllTrackedGuilds } from './database';
import { notifyStreamOnline } from '../listeners/twitchStreamOnline';

const POLL_INTERVAL_MS = 60_000;

export class TwitchService {
  static instance: TwitchService | null = null;

  private api: ApiClient;
  private liveStatus = new Map<string, boolean>();
  private intervalId?: NodeJS.Timeout;

  constructor(private discord: Client) {
    const auth = new AppTokenAuthProvider(config.twitch.clientId, config.twitch.clientSecret);
    this.api = new ApiClient({ authProvider: auth });
    TwitchService.instance = this;
  }

  start(): void {
    void this.poll();
    this.intervalId = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  getLiveStatuses(): Map<string, boolean> {
    return new Map(this.liveStatus);
  }

  async getUserByName(login: string): Promise<HelixUser | null> {
    return this.api.users.getUserByName(login);
  }

  private async poll(): Promise<void> {
    const guilds = getAllTrackedGuilds();
    const allLogins = [...new Set(guilds.flatMap(g => g.trackedStreamers))];
    if (allLogins.length === 0) return;

    try {
      const streams = await this.api.streams.getStreamsByUserNames(allLogins);
      const nowLive = new Set(streams.map(s => s.userName.toLowerCase()));

      for (const login of allLogins) {
        const loginLower = login.toLowerCase();
        const wasLive = this.liveStatus.get(loginLower) ?? false;
        const isLive = nowLive.has(loginLower);

        if (!wasLive && isLive) {
          const stream = streams.find(s => s.userName.toLowerCase() === loginLower);
          if (stream) {
            const user = await this.api.users.getUserById(stream.userId);
            await notifyStreamOnline(this.discord, guilds, login, stream, user?.profilePictureUrl);
          }
        }

        this.liveStatus.set(loginLower, isLive);
      }
    } catch (err) {
      console.error('[Twitch] Poll error:', err);
    }
  }
}
