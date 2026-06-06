import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Afficher les informations du serveur'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = await interaction.guild!.fetch();

    const channels = guild.channels.cache;
    const textCount  = channels.filter(c => c.type === 0).size;
    const voiceCount = channels.filter(c => c.type === 2).size;

    const boostLevel = ['Aucun', 'Niveau 1', 'Niveau 2', 'Niveau 3'][guild.premiumTier] ?? 'Inconnu';

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: '👑 Propriétaire',    value: `<@${guild.ownerId}>`,                                    inline: true },
        { name: '📅 Créé le',         value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,     inline: true },
        { name: '👥 Membres',         value: guild.memberCount.toLocaleString(),                       inline: true },
        { name: '💬 Salons texte',    value: textCount.toString(),                                     inline: true },
        { name: '🔊 Salons vocaux',   value: voiceCount.toString(),                                    inline: true },
        { name: '🎭 Rôles',           value: guild.roles.cache.size.toString(),                        inline: true },
        { name: '✨ Boost',           value: `${boostLevel} (${guild.premiumSubscriptionCount ?? 0})`, inline: true },
        { name: '🌍 Région',          value: guild.preferredLocale,                                    inline: true },
      )
      .setFooter({ text: `ID : ${guild.id}` })
      .setTimestamp();

    if (guild.description) embed.setDescription(guild.description);
    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
