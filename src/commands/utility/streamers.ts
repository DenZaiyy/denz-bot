import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import { getGuildSettings } from '../../services/database';
import { TwitchService } from '../../services/twitch';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('streamers')
    .setDescription('Voir le statut live des streamers surveillés sur ce serveur'),

  async execute(interaction: ChatInputCommandInteraction) {
    const settings = getGuildSettings(interaction.guildId!);

    if (settings.trackedStreamers.length === 0) {
      await interaction.reply({
        content: 'Aucun streamer surveillé. Utilise `/config addstreamer` pour en ajouter.',
        ephemeral: true,
      });
      return;
    }

    const liveStatuses = TwitchService.instance?.getLiveStatuses() ?? new Map<string, boolean>();

    const lines = settings.trackedStreamers.map(login => {
      const isLive = liveStatuses.get(login.toLowerCase()) ?? false;
      const indicator = isLive ? '🔴 **En live**' : '⚫ Hors ligne';
      return `${indicator} — [${login}](https://twitch.tv/${login})`;
    });

    const liveCount = settings.trackedStreamers.filter(l => liveStatuses.get(l.toLowerCase())).length;

    const embed = new EmbedBuilder()
      .setTitle('📺 Statut des streamers')
      .setColor(liveCount > 0 ? 0xff0000 : 0x99aab5)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `${liveCount} en live · Mis à jour toutes les 60s` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
