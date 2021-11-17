const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Choisit quel type d\'informations tu souhaite recevoir!')
        .addSubcommand(subcommand => subcommand
            .setName('user')
            .setDescription('Répond avec les informations concernant un utilisateur du discord!')
            .addUserOption(option => option.setName('target').setDescription('L\'utilisateur')))
        .addSubcommand(subcommand => subcommand
            .setName('server')
            .setDescription('Répond avec les informations concernant le serveur!')),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'user') {
			const user = interaction.options.getUser('target');

			if (user) {
				await interaction.reply(`Tag: **${user.tag}**\nID: **${user.id}**`);
			} else {
				await interaction.reply(`Ton tag: **${interaction.user.tag}**\nTon ID: **${interaction.user.id}**`);
			}
		} else if (interaction.options.getSubcommand() === 'server') {
			await interaction.reply(`Nom du serveur: **${interaction.guild.name}**\nMembres au totale: **${interaction.guild.memberCount}**`);
		}
        // await interaction.reply(`Ton tag: **${interaction.user.tag}**\nTon id: **${interaction.user.id}**`);
    },
};