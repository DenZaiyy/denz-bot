import type { ChatInputCommandInteraction, GuildMember } from 'discord.js';

export async function checkSameVoice(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const botChannelId = interaction.guild?.members.me?.voice?.channelId ?? null;

  if (!botChannelId) {
    await interaction.reply({ content: 'Je ne suis pas dans un salon vocal.', ephemeral: true });
    return false;
  }

  const member = await interaction.guild!.members.fetch(interaction.user.id).catch(() => null);
  if (!member) {
    await interaction.reply({ content: 'Impossible de récupérer tes informations.', ephemeral: true });
    return false;
  }

  if (member.voice.channelId !== botChannelId) {
    await interaction.reply({ content: 'Tu dois être dans le même salon vocal que moi.', ephemeral: true });
    return false;
  }

  return true;
}
