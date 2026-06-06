import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { GuildSettings } from '../types';

const dataDir = join(__dirname, '../../data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'guilds.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    notification_channel_id TEXT,
    welcome_channel_id TEXT,
    tracked_streamers TEXT NOT NULL DEFAULT '[]'
  )
`);

// Migration : ajoute la colonne si elle n'existe pas encore (DB existante)
try { db.exec('ALTER TABLE guild_settings ADD COLUMN welcome_channel_id TEXT'); } catch {}

const stmts = {
  get: db.prepare<[string]>('SELECT * FROM guild_settings WHERE guild_id = ?'),
  upsert: db.prepare<[string, string | null, string | null, string]>(`
    INSERT INTO guild_settings (guild_id, notification_channel_id, welcome_channel_id, tracked_streamers)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      notification_channel_id = excluded.notification_channel_id,
      welcome_channel_id      = excluded.welcome_channel_id,
      tracked_streamers       = excluded.tracked_streamers
  `),
  allTracked: db.prepare("SELECT * FROM guild_settings WHERE tracked_streamers != '[]'"),
};

type Row = {
  guild_id: string;
  notification_channel_id: string | null;
  welcome_channel_id: string | null;
  tracked_streamers: string;
};

function toSettings(row: Row): GuildSettings {
  return {
    guildId: row.guild_id,
    notificationChannelId: row.notification_channel_id ?? null,
    welcomeChannelId: row.welcome_channel_id ?? null,
    trackedStreamers: JSON.parse(row.tracked_streamers ?? '[]') as string[],
  };
}

export function getGuildSettings(guildId: string): GuildSettings {
  const row = stmts.get.get(guildId) as Row | undefined;
  return row ? toSettings(row) : { guildId, notificationChannelId: null, welcomeChannelId: null, trackedStreamers: [] };
}

export function saveGuildSettings(settings: GuildSettings): void {
  stmts.upsert.run(
    settings.guildId,
    settings.notificationChannelId,
    settings.welcomeChannelId,
    JSON.stringify(settings.trackedStreamers),
  );
}

export function getAllTrackedGuilds(): GuildSettings[] {
  return (stmts.allTracked.all() as Row[]).map(toSettings);
}
