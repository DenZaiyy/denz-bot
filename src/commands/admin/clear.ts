import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
  GuildMember,
  DiscordAPIError,
} from 'discord.js';
import type { Command } from '../../types';

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function canManageMessages(interaction: ChatInputCommandInteraction): boolean {
  const member = interaction.member as GuildMember;
  return (
    interaction.guild?.ownerId === interaction.user.id ||
    member.permissions.has(PermissionFlagsBits.ManageMessages)
  );
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprimer des messages du salon')
    .addIntegerOption(opt =>
      opt
        .setName('nombre')
        .setDescription('Nombre de messages à supprimer (vide = tous les messages récents possibles)')
        .setMinValue(1)
        .setMaxValue(1000)
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!canManageMessages(interaction)) {
      await interaction.reply({
        content: '🚫 Tu dois avoir la permission **Gérer les messages** pour utiliser cette commande.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel as TextChannel;
    const amount = interaction.options.getInteger('nombre'); // null = supprimer tout
    const cutoff = Date.now() - TWO_WEEKS_MS;
    let deleted = 0;
    let hitAgeLimit = false;

    try {
      while (true) {
        const batchSize = amount !== null ? Math.min(amount - deleted, 100) : 100;
        if (batchSize <= 0) break;

        const messages = await channel.messages.fetch({ limit: batchSize });
        if (messages.size === 0) break;

        // Sépare les messages récents (bulk delete) des anciens (suppression unitaire)
        const recent = messages.filter(m => m.createdTimestamp > cutoff);
        const old = messages.filter(m => m.createdTimestamp <= cutoff);

        // Bulk delete des messages récents (2 mini requis par l'API Discord)
        if (recent.size >= 2) {
          const result = await channel.bulkDelete(recent, true);
          deleted += result.size;
        } else if (recent.size === 1) {
          await recent.first()!.delete();
          deleted += 1;
        }

        // Suppression un par un des messages anciens (> 14 jours)
        if (old.size > 0 && (amount === null || deleted < amount)) {
          hitAgeLimit = true;
          for (const [, msg] of old) {
            if (amount !== null && deleted >= amount) break;
            try {
              await msg.delete();
              deleted += 1;
              // Pause pour éviter le rate limit (1 delete/s max recommandé)
              await new Promise(r => setTimeout(r, 1_100));
            } catch {
              // Message déjà supprimé ou inaccessible — on continue
            }
          }
        }

        // Fin : plus aucun message ou quota atteint
        if (messages.size < batchSize) break;
        if (amount !== null && deleted >= amount) break;

        // Pause entre les batches
        await new Promise(r => setTimeout(r, 500));
      }

      const lines = [`✅ **${deleted}** message(s) supprimé(s).`];
      if (hitAgeLimit) {
        lines.push('⚠️ Certains messages de plus de 14 jours ont été supprimés un par un (plus lent — limitation Discord).');
      }
      if (amount === null && !hitAgeLimit) {
        lines.push('ℹ️ Les messages de plus de 14 jours ne peuvent pas être supprimés en masse.');
      }

      await interaction.editReply(lines.join('\n'));
    } catch (err) {
      const isPerms = err instanceof DiscordAPIError && err.code === 50013;
      await interaction.editReply(
        isPerms
          ? `❌ Je n'ai pas la permission **Gérer les messages** dans ce salon.`
          : `❌ Erreur inattendue. **${deleted}** message(s) supprimé(s) avant l'erreur.`,
      );
    }
  },
};

export default command;
