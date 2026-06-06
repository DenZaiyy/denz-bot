import { Collection, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
  data: Pick<SlashCommandBuilder, 'name' | 'toJSON'>;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface Track {
  title: string;
  url: string;
  thumbnail?: string;
  durationMs: number;
  requestedBy: string;
}

export type LoopMode = 'none' | 'track' | 'queue';

export interface GuildSettings {
  guildId: string;
  notificationChannelId: string | null;
  welcomeChannelId: string | null;
  trackedStreamers: string[];
}

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}
