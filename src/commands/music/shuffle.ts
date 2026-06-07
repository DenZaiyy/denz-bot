import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types';
import { musicService } from '../../services/music/MusicService';
import { checkSameVoice } from '../../utils/checkVoice';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Activer ou désactiver le mode shuffle'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!await checkSameVoice(interaction)) return;
    const result = musicService.toggleShuffle(interaction.guildId!);
    if (!result) {
      await interaction.reply({ content: 'Rien en cours de lecture.', ephemeral: true });
    } else if (result.enabled) {
      await interaction.reply(`🔀 Shuffle activé — **${result.count}** chanson(s) mélangées.`);
      musicService.trackSessionMessage(interaction.guildId!, await interaction.fetchReply());
    } else {
      await interaction.reply('➡️ Shuffle désactivé.');
      musicService.trackSessionMessage(interaction.guildId!, await interaction.fetchReply());
    }
  },
};

export default command;
