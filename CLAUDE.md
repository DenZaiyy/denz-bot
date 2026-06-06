# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discord bot built with TypeScript and Discord.js with two core feature sets:
- **Music**: Playback via YouTube and Spotify (Spotify track URLs resolved to YouTube audio via oEmbed — no Spotify API credentials needed)
- **Stream notifications**: Twitch API polling that posts live alerts to configured Discord channels

## Tech Stack

- **Runtime**: Node.js (v20+) with TypeScript
- **Discord**: `discord.js` v14+ (slash commands, voice, embeds)
- **Music**: `@discordjs/voice` + `play-dl` for YouTube streaming; Spotify resolved via public oEmbed endpoint
- **Twitch**: `@twurple/api` + `@twurple/auth` with app token, polling every 60 s for stream status changes
- **Storage**: `better-sqlite3` for per-guild settings (notification channel, tracked streamers)

## Commands

```bash
npm run dev        # tsx watch mode — runs TypeScript directly
npm run build      # tsc — compiles to dist/
npm start          # node dist/index.js
npm run lint       # eslint
npm run lint:fix   # eslint --fix
npm run deploy     # register slash commands with Discord (run after adding/changing commands)
```

> Set `DISCORD_GUILD_ID` in `.env` for instant guild-scoped registration during dev; omit it for global registration (up to 1 hour to propagate).

## Architecture

### Entry Point

`src/index.ts` — creates the Discord client, dynamically loads all commands and events, starts Twitch polling, then logs in.

### Handler Loading Pattern

Commands and Discord events are loaded dynamically from their directories — adding a new command or event only requires creating a new file:

```
src/
  commands/          # Slash command files — each exports a default Command object
    music/           # play, skip, stop, queue, nowplaying
    utility/         # ping
  events/            # Discord client events — filename = event name (e.g. ready.ts, interactionCreate.ts)
  listeners/         # Notification dispatch (twitchStreamOnline.ts)
  services/
    music/
      GuildQueue.ts  # Holds AudioPlayer + VoiceConnection per guild
      MusicService.ts# Singleton — manages per-guild queues, voice joins, playback lifecycle
    spotify.ts       # Resolves Spotify track URLs → search query via public oEmbed (no auth)
    youtube.ts       # play-dl wrapper for search, video info, and audio stream creation
    twitch.ts        # Polls Twitch API every 60 s; fires notifyStreamOnline on offline→online transitions
    database.ts      # better-sqlite3 wrapper for guild_settings table
  config.ts          # Reads + validates env vars at startup; throws on missing required vars
  types.ts           # Shared interfaces (Command, Track, GuildSettings) + discord.js module augmentation
  deploy-commands.ts # Standalone script to register slash commands
```

### Music Flow

1. User runs `/play <query or URL>`
2. `commands/music/play.ts` resolves input:
   - Spotify URL → oEmbed fetch (title + artist) → YouTube search
   - YouTube URL → `play-dl.video_info()`
   - Plain text → `play-dl.search()`
3. Track pushed onto the per-guild queue in `MusicService`
4. `MusicService` joins the voice channel (if not already), plays the track, and on `AudioPlayerStatus.Idle` advances to the next track automatically
5. Auto-disconnects after 5 minutes of an empty idle queue

### Twitch Notification Flow

1. On startup, `TwitchService.start()` polls immediately then every 60 s
2. Fetches current live streams for all unique tracked streamers across all guilds (single batched API call)
3. Compares against previous poll state; fires `notifyStreamOnline()` only on offline → online transitions
4. `listeners/twitchStreamOnline.ts` sends a Twitch-branded embed to each guild's configured channel

### Configuration

Required environment variables (see `.env.example`):

```
DISCORD_TOKEN
DISCORD_CLIENT_ID
DISCORD_GUILD_ID   # optional
TWITCH_CLIENT_ID
TWITCH_CLIENT_SECRET
```

No Spotify credentials required — the oEmbed endpoint is public.

### Guild State

`data/guilds.db` (SQLite, created at runtime) — `guild_settings` table stores `notification_channel_id` and `tracked_streamers` (JSON array of Twitch user logins) per guild.
