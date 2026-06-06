import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types';
import { musicService } from '../../services/music/MusicService';
import { checkSameVoice } from '../../utils/checkVoice';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Passer à la chanson suivante'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!await checkSameVoice(interaction)) return;
    const skipped = musicService.skip(interaction.guildId!);
    if (!skipped) {
      await interaction.reply({ content: 'Rien en cours de lecture.', ephemeral: true });
    } else {
      await interaction.reply(`⏭ **${skipped.title}** passé.`);
    }
  },
};

export default command;
