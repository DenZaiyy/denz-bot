import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import ffmpegPath from 'ffmpeg-static';
import { config } from './config';
import type { Command } from './types';
import { TwitchService } from './services/twitch';

// Make ffmpeg-static binary available to @discordjs/voice and play-dl
if (ffmpegPath) process.env['FFMPEG_PATH'] = ffmpegPath;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection<string, Command>();
const requireModule = createRequire(__filename);

function loadCommands(): void {
  for (const dir of ['music', 'utility', 'admin']) {
    const dirPath = join(__dirname, 'commands', dir);
    let files: string[];
    try {
      files = readdirSync(dirPath).filter(f => /\.(js|ts)$/.test(f) && !f.endsWith('.d.ts'));
    } catch {
      console.warn(`[Commands] Directory not found, skipping: ${dirPath}`);
      continue;
    }
    for (const file of files) {
      try {
        const mod = requireModule(join(dirPath, file)) as { default: Command };
        client.commands.set(mod.default.data.name, mod.default);
        console.log(`[Commands] Loaded: ${mod.default.data.name}`);
      } catch (err) {
        console.error(`[Commands] Failed to load ${file}:`, err);
      }
    }
  }
}

function loadEvents(): void {
  const eventDir = join(__dirname, 'events');
  const files = readdirSync(eventDir).filter(f => /\.(js|ts)$/.test(f) && !f.endsWith('.d.ts'));
  for (const file of files) {
    const mod = requireModule(join(eventDir, file)) as { default: (...args: unknown[]) => void; once?: boolean };
    const eventName = file.replace(/\.(js|ts)$/, '');
    if (mod.once) {
      client.once(eventName, (...args) => mod.default(client, ...args));
    } else {
      client.on(eventName, (...args) => mod.default(client, ...args));
    }
  }
}

loadCommands();
loadEvents();

const twitch = new TwitchService(client);
twitch.start();

void client.login(config.discord.token);
