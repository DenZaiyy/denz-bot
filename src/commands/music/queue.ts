import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import { musicService } from '../../services/music/MusicService';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current queue'),

  async execute(interaction: ChatInputCommandInteraction) {
    const { current, upcoming } = musicService.getQueue(interaction.guildId!);

    if (!current && upcoming.length === 0) {
      await interaction.reply({ content: 'The queue is empty.', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder().setTitle('Music Queue').setColor(0x5865f2);

    if (current) {
      embed.addFields({ name: '▶ Now Playing', value: `**${current.title}** — ${current.requestedBy}` });
    }

    if (upcoming.length > 0) {
      const list = upcoming
        .slice(0, 10)
        .map((t, i) => `${i + 1}. **${t.title}** — ${t.requestedBy}`)
        .join('\n');
      const suffix = upcoming.length > 10 ? `\n*…and ${upcoming.length - 10} more*` : '';
      embed.addFields({ name: `Up Next (${upcoming.length})`, value: list + suffix });
    }

    await interaction.reply({ embeds: [embed] });
    musicService.trackSessionMessage(interaction.guildId!, await interaction.fetchReply());
  },
};

export default command;
