import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Afficher les informations d\'un membre')
    .addUserOption(opt =>
      opt.setName('membre').setDescription('Membre à inspecter (toi-même si vide)').setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('membre') ?? interaction.user;
    const member = await interaction.guild!.members.fetch(target.id).catch(() => null);

    const roles = member?.roles.cache
      .filter(r => r.id !== interaction.guild!.id)
      .sort((a, b) => b.position - a.position)
      .map(r => r.toString())
      .slice(0, 15) ?? [];

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor && member.displayHexColor !== '#000000' ? member.displayHexColor : 0x5865f2)
      .setTitle(member?.displayName ?? target.username)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🏷️ Nom d\'utilisateur', value: target.username,                                                      inline: true },
        { name: '🤖 Bot',                 value: target.bot ? 'Oui' : 'Non',                                           inline: true },
        { name: '📅 Compte créé',         value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`,                inline: true },
      );

    if (member?.joinedTimestamp) {
      embed.addFields({ name: '📥 A rejoint le serveur', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true });
    }
    if (member?.premiumSinceTimestamp) {
      embed.addFields({ name: '✨ Booste depuis', value: `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`, inline: true });
    }
    if (roles.length > 0) {
      const suffix = (member?.roles.cache.size ?? 1) - 1 > 15 ? ` *+${(member?.roles.cache.size ?? 1) - 16} autres*` : '';
      embed.addFields({ name: `🎭 Rôles (${(member?.roles.cache.size ?? 1) - 1})`, value: roles.join(' ') + suffix });
    }

    embed.setFooter({ text: `ID : ${target.id}` }).setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
