import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types';
import { musicService } from '../../services/music/MusicService';
import { checkSameVoice } from '../../utils/checkVoice';

const LOOP_LABELS = {
  none:  '➡️ Pas de répétition',
  track: '🔂 Répétition de la chanson en cours',
  queue: '🔁 Répétition de la file entière',
};

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Changer le mode de répétition (aucun → chanson → file → aucun)'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!await checkSameVoice(interaction)) return;
    const mode = musicService.toggleLoop(interaction.guildId!);
    if (mode === null) {
      await interaction.reply({ content: 'Rien en cours de lecture.', ephemeral: true });
    } else {
      await interaction.reply(LOOP_LABELS[mode]);
      musicService.trackSessionMessage(interaction.guildId!, await interaction.fetchReply());
    }
  },
};

export default command;
