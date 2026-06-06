import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import type { Command, Track } from '../../types';
import { musicService } from '../../services/music/MusicService';
import { resolve } from '../../services/youtube';
import type { SendableChannel } from '../../services/music/GuildQueue';

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Joue une musique (YouTube, Spotify, ou recherche texte)')
    .addStringOption(opt =>
      opt
        .setName('query')
        .setDescription('URL YouTube, URL Spotify, ou termes de recherche')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const member = interaction.member as GuildMember;
    if (!member.voice.channelId) {
      await interaction.editReply('Tu dois être dans un salon vocal pour utiliser cette commande.');
      return;
    }

    const query = interaction.options.getString('query', true);

    try {
      const info = await resolve(query);
      if (!info) {
        await interaction.editReply('Aucun résultat trouvé.');
        return;
      }

      const track: Track = {
        title: info.title,
        url: info.url,
        thumbnail: info.thumbnail,
        durationMs: info.durationMs,
        requestedBy: member.displayName,
      };

      const { position, wasPlaying } = await musicService.enqueue(
        member,
        track,
        interaction.channel as SendableChannel,
      );

      if (!wasPlaying) {
        await interaction.editReply('▶ Lecture lancée !');
      } else {
        await interaction.editReply(
          `Ajouté à la file **#${position}** : **${info.title}** \`[${formatDuration(info.durationMs)}]\``,
        );
      }
    } catch (err) {
      console.error('[play]', err);
      await interaction.editReply('Impossible de lire ce contenu.');
    }
  },
};

export default command;
