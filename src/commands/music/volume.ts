import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types';
import { musicService } from '../../services/music/MusicService';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Voir ou changer le volume de lecture (0–100)')
    .addIntegerOption(opt =>
      opt
        .setName('percent')
        .setDescription('Niveau de volume (0–100)')
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const percent = interaction.options.getInteger('percent');

    if (percent === null) {
      const current = musicService.getVolume(interaction.guildId!);
      if (current === null) {
        await interaction.reply({ content: 'Aucune musique en cours.', ephemeral: true });
      } else {
        await interaction.reply({ content: `🔊 Volume actuel : **${current}%**`, ephemeral: true });
      }
      return;
    }

    const ok = musicService.setVolume(interaction.guildId!, percent);
    if (!ok) {
      await interaction.reply({ content: 'Aucune musique en cours.', ephemeral: true });
    } else {
      await interaction.reply(`🔊 Volume réglé à **${percent}%**`);
    }
  },
};

export default command;
