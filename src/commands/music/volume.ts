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
      await interaction.reply({ content: `🔊 Volume actuel : **${current}%**`, ephemeral: true });
      return;
    }

    musicService.setVolume(interaction.guildId!, percent);
    await interaction.reply(`🔊 Volume réglé à **${percent}%**`);
    musicService.trackSessionMessage(interaction.guildId!, await interaction.fetchReply());
  },
};

export default command;
