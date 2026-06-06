import { Collection, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
  data: Pick<SlashCommandBuilder, 'name' | 'toJSON'>;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface Track {
  title: string;
  url: string;           // URL YouTube ; chaîne vide = résolution paresseuse via searchQuery
  searchQuery?: string;  // requête YouTube pour les tracks Spotify en attente de résolution
  thumbnail?: string;
  durationMs: number;
  requestedBy: string;
  audioQuality?: {
    formatId?: string;
    codec?: string;
    container?: string;
    bitrateKbps?: number;
    sampleRateHz?: number;
  };
}

export type LoopMode = 'none' | 'track' | 'queue';

export interface GuildSettings {
  guildId: string;
  notificationChannelId: string | null;
  welcomeChannelId: string | null;
  trackedStreamers: string[];
  volumePercent: number;
}

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}
