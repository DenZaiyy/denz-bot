import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from './config';
import type { Command } from './types';

const commands: object[] = [];

for (const dir of ['music', 'utility', 'admin']) {
  const dirPath = join(__dirname, 'commands', dir);
  const files = readdirSync(dirPath).filter(f => /\.(js|ts)$/.test(f) && !f.endsWith('.d.ts'));
  for (const file of files) {
    const mod = require(join(dirPath, file)) as { default: Command };
    commands.push(mod.default.data.toJSON());
  }
}

const rest = new REST().setToken(config.discord.token);

(async () => {
  console.log(`Registering ${commands.length} slash commands…`);
  if (config.discord.guildId) {
    await rest.put(
      Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
      { body: commands },
    );
    console.log(`Registered to guild ${config.discord.guildId} (instant)`);
  } else {
    await rest.put(Routes.applicationCommands(config.discord.clientId), { body: commands });
    console.log('Registered globally (up to 1 hour to propagate)');
  }
})();
