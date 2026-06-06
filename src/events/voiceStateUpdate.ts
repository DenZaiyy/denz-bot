import { Client, VoiceState } from 'discord.js';
import { musicService } from '../services/music/MusicService';

const ALONE_TIMEOUT_MS = 30_000;
const timers = new Map<string, NodeJS.Timeout>();

export default function voiceStateUpdate(_client: Client, _old: VoiceState, newState: VoiceState): void {
  const botChannel = newState.guild.members.me?.voice.channel;
  if (!botChannel) return;

  const guildId = newState.guild.id;
  const humans = botChannel.members.filter(m => !m.user.bot);

  if (humans.size === 0) {
    if (!timers.has(guildId)) {
      timers.set(guildId, setTimeout(() => {
        musicService.stop(guildId);
        timers.delete(guildId);
      }, ALONE_TIMEOUT_MS));
    }
  } else {
    const t = timers.get(guildId);
    if (t) { clearTimeout(t); timers.delete(guildId); }
  }
}
