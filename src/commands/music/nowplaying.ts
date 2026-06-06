import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types';
import { musicService } from '../../services/music/MusicService';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Réaffiche le panneau de lecture en cours'),

  async execute(interaction: ChatInputCommandInteraction) {
    const { current } = musicService.getQueue(interaction.guildId!);
    if (!current) {
      await interaction.reply({ content: 'Rien en cours de lecture.', ephemeral: true });
      return;
    }
    // Force a fresh embed in the channel by updating the stored message
    await musicService.updateNowPlayingEmbed(interaction.guildId!);
    await interaction.reply({ content: '↑ Panneau mis à jour.', ephemeral: true });
  },
};

export default command;
