import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types';
import { musicService } from '../../services/music/MusicService';
import { checkSameVoice } from '../../utils/checkVoice';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Arrêter la lecture et vider la file'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!await checkSameVoice(interaction)) return;
    musicService.stop(interaction.guildId!);
    await interaction.reply('⏹ Lecture arrêtée et file vidée.');
  },
};

export default command;
