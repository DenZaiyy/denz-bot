const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Choisit quel type d\'informations tu souhaite recevoir!')
        .addSubcommand(subcommand => subcommand
            .setName('user')
            .setDescription('Répond avec les informations concernant un utilisateur du discord!')
            .addUserOption(option => option.setName('target').setDescription('L\'utilisateur').setRequired(false)))
        .addSubcommand(subcommand => subcommand
            .setName('server')
            .setDescription('Répond avec les informations concernant le serveur!')),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'user') {
			const user = interaction.options.getUser('target');

			if (user) {
				await interaction.reply({ content: `Avatar URL: **${user.displayAvatarURL({format: "png", size: 600 })}**\nTag: **${user.tag}**\nID: **${user.id}**`, ephemeral: true});
			} else {
				await interaction.reply({ content: `Ton tag: **${interaction.user.tag}**\nTon ID: **${interaction.user.id}**`, ephemeral: true});
			}
		} else if (interaction.options.getSubcommand() === 'server') {
			await interaction.reply({ content: `Nom du serveur: **${interaction.guild.name}**\nMembres au totale: **${interaction.guild.memberCount}**`, ephemeral: false});
		}
    },
};