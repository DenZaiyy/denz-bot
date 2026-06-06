import { Client, ActivityType } from 'discord.js';

export const once = true;

export default function ready(client: Client): void {
  console.log(`Logged in as ${client.user?.tag}`);
  client.user?.setActivity('music & streams', { type: ActivityType.Watching });
}
