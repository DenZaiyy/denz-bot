import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  GuildMember,
} from 'discord.js';
import type { Command } from '../../types';

interface CommandEntry {
  usage: string;
  description: string;
}

const MUSIC: CommandEntry[] = [
  { usage: '/play <url ou recherche>',  description: 'Jouer depuis YouTube, Spotify ou une recherche texte' },
  { usage: '/skip',                     description: 'Passer à la chanson suivante' },
  { usage: '/stop',                     description: 'Arrêter la lecture et vider la file' },
  { usage: '/loop',                     description: 'Changer le mode répétition (aucun → chanson → file)' },
  { usage: '/shuffle',                  description: 'Mélanger aléatoirement la file d\'attente' },
  { usage: '/queue',                    description: 'Afficher la file d\'attente' },
  { usage: '/nowplaying',               description: 'Réafficher le panneau de lecture en cours' },
  { usage: '/volume [0-100]',           description: 'Voir ou régler le volume de lecture' },
];

const UTILITY: CommandEntry[] = [
  { usage: '/streamers',                description: 'Voir le statut live des streamers surveillés' },
  { usage: '/serverinfo',               description: 'Afficher les informations du serveur' },
  { usage: '/userinfo [membre]',        description: 'Afficher les informations d\'un membre' },
  { usage: '/ping',                     description: 'Vérifier la latence du bot' },
  { usage: '/help',                     description: 'Afficher cette aide' },
];

const ADMIN: CommandEntry[] = [
  { usage: '/config setchannel #salon',         description: 'Définir le salon pour les notifications Twitch' },
  { usage: '/config setwelcome [#salon]',       description: 'Définir le salon de bienvenue/départ (vide = désactiver)' },
  { usage: '/config addstreamer <login>',        description: 'Ajouter un streamer Twitch à surveiller' },
  { usage: '/config removestreamer <login>',     description: 'Retirer un streamer de la surveillance' },
  { usage: '/config list',                       description: 'Afficher la configuration du serveur' },
  { usage: '/config testnotif <login>',          description: 'Envoyer un embed de notification de test' },
  { usage: '/clear [nombre]',                    description: 'Supprimer des messages du salon' },
];

function fmt(entries: CommandEntry[]): string {
  return entries.map(e => `\`${e.usage}\`\n┗ ${e.description}`).join('\n\n');
}

function isAdmin(interaction: ChatInputCommandInteraction): boolean {
  const member = interaction.member as GuildMember;
  return (
    interaction.guild?.ownerId === interaction.user.id ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Afficher toutes les commandes disponibles'),

  async execute(interaction: ChatInputCommandInteraction) {
    const admin = isAdmin(interaction);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📖 Commandes disponibles')
      .setThumbnail(interaction.client.user?.displayAvatarURL() ?? null)
      .addFields(
        { name: '🎵 Musique', value: fmt(MUSIC) },
        { name: '🔧 Utilitaire', value: fmt(UTILITY) },
      );

    if (admin) {
      embed.addFields({ name: '⚙️ Administration', value: fmt(ADMIN) });
      embed.setFooter({ text: '🔑 Tu vois les commandes admin car tu es administrateur.' });
    } else {
      embed.setFooter({ text: 'Les commandes d\'administration sont réservées aux admins.' });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
