import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),

  async execute(interaction: ChatInputCommandInteraction) {
    const { resource } = await interaction.reply({ content: 'Pinging…', withResponse: true });
    const latency = resource!.message!.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`Pong! Latency: **${latency}ms** | API: **${interaction.client.ws.ping}ms**`);
  },
};

export default command;
