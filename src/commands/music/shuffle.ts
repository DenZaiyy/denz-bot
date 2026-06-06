import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types';
import { musicService } from '../../services/music/MusicService';
import { checkSameVoice } from '../../utils/checkVoice';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mélanger aléatoirement la file d\'attente'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!await checkSameVoice(interaction)) return;
    const count = musicService.shuffleQueue(interaction.guildId!);
    if (count === 0) {
      await interaction.reply({ content: 'La file est vide ou ne contient qu\'une seule chanson.', ephemeral: true });
    } else {
      await interaction.reply(`🔀 **${count}** chanson(s) mélangées dans la file.`);
    }
  },
};

export default command;
