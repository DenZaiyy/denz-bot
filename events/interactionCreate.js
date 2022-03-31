module.exports = {
	name: 'interactionCreate',
	execute(interaction) {
		console.log(`${interaction.user.tag} déclenche une interaction (${interaction.commandName}) dans #${interaction.channel.name}.`);
	},
};