module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Connecter en tant que ${client.user.tag} !`);
	},
};
