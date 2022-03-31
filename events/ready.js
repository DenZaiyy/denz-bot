module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		client.user.setActivity('denzaiyy.fr | /help');
		console.log(`Connecter en tant que ${client.user.tag}`);
	},
};
