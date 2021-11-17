module.exports = {
	name: 'interactionCreate',
	execute(interaction) {
		console.log(`${interaction.user.tag} dans #${interaction.channel.name} déclenche une interaction.`);
	},
};