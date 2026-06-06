import { Client, Interaction, ButtonInteraction } from 'discord.js';
import { musicService } from '../services/music/MusicService';

async function handleMusicButton(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferUpdate();
  const guildId = interaction.guildId!;

  switch (interaction.customId) {
    case 'music_pause_resume':
      await musicService.togglePause(guildId);
      break;
    case 'music_skip':
      musicService.skip(guildId);
      break;
    case 'music_stop':
      musicService.stop(guildId);
      break;
  }
}

export default async function interactionCreate(client: Client, interaction: Interaction): Promise<void> {
  if (interaction.isButton() && interaction.customId.startsWith('music_')) {
    await handleMusicButton(interaction as ButtonInteraction);
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[Command:${interaction.commandName}]`, err);
    const msg = { content: 'Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}
