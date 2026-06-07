import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import type { Command, Track } from '../../types';
import { musicService } from '../../services/music/MusicService';
import { resolve, isPlaylistUrl, resolvePlaylist } from '../../services/youtube';
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
    const member = interaction.member as GuildMember;

    if (!member.voice.channelId) {
      await interaction.reply({ content: 'Tu dois être dans un salon vocal pour utiliser cette commande.', ephemeral: true });
      return;
    }

    // Defer public : les messages d'ajout à la file seront visibles par tous
    await interaction.deferReply({ ephemeral: false });

    const query = interaction.options.getString('query', true);
    const textChannel = interaction.channel as SendableChannel;

    // — Playlist YouTube —
    if (isPlaylistUrl(query)) {
      try {
        await interaction.editReply('⏳ Chargement de la playlist…');
        const entries = await resolvePlaylist(query);
        if (!entries.length) {
          await interaction.editReply('❌ Playlist vide ou inaccessible.');
          return;
        }
        const tracks: Track[] = entries.map(e => ({
          title: e.title,
          url: e.url,
          thumbnail: e.thumbnail,
          durationMs: e.durationMs,
          requestedBy: member.displayName,
        }));
        const { total, wasPlaying } = await musicService.enqueueMany(member, tracks, textChannel);
        const reply = await interaction.editReply(
          wasPlaying
            ? `✅ **${total}** musiques ajoutées à la file depuis la playlist.`
            : `▶ Lecture lancée ! **${total}** musiques chargées depuis la playlist.`,
        );
        musicService.trackSessionMessage(interaction.guildId!, reply);
      } catch (err) {
        console.error('[play:playlist]', err);
        await interaction.editReply('❌ Impossible de charger la playlist.');
      }
      return;
    }

    // — Piste unique (YouTube URL, Spotify URL, ou recherche texte) —
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
        audioQuality: info.audioQuality,
      };

      const { position, wasPlaying } = await musicService.enqueue(member, track, textChannel);

      if (!wasPlaying) {
        const reply = await interaction.editReply(`▶ Lecture lancée : **${info.title}** \`[${formatDuration(info.durationMs)}]\``);
        musicService.trackSessionMessage(interaction.guildId!, reply);
      } else {
        const reply = await interaction.editReply(
          `Ajouté à la file **#${position}** : **${info.title}** \`[${formatDuration(info.durationMs)}]\``,
        );
        musicService.trackSessionMessage(interaction.guildId!, reply);
      }
    } catch (err) {
      console.error('[play]', err);
      await interaction.editReply('❌ Impossible de lire ce contenu.');
    }
  },
};

export default command;
