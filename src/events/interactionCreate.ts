import { Client, Interaction, ButtonInteraction, GuildMember } from 'discord.js';
import { musicService } from '../services/music/MusicService';

async function handleMusicButton(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferUpdate();
  const guildId = interaction.guildId!;
  const actor = (interaction.member as GuildMember).displayName;

  switch (interaction.customId) {
    case 'music_pause_resume': {
      const current = musicService.getQueue(guildId).current;
      const isPaused = await musicService.togglePause(guildId);
      if (isPaused === null || !current) {
        await interaction.followUp({ content: 'Rien en cours de lecture.', ephemeral: true });
      } else {
        await musicService.replaceStatusMessage(
          guildId,
          () => interaction.followUp({
            content: isPaused
              ? `⏸ **${current.title}** mis en pause par **${actor}**.`
              : `▶ **${current.title}** repris par **${actor}**.`,
            fetchReply: true,
          }),
        );
      }
      break;
    }
    case 'music_skip': {
      const skipped = musicService.skip(guildId);
      if (!skipped) {
        await interaction.followUp({ content: 'Rien en cours de lecture.', ephemeral: true });
      } else {
        await musicService.replaceStatusMessage(
          guildId,
          () => interaction.followUp({
            content: `⏭ **${skipped.title}** passé par **${actor}**.`,
            fetchReply: true,
          }),
        );
      }
      break;
    }
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
