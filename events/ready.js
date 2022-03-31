module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		client.user.setActivity('denzaiyy.fr | /help', { type: 'STREAMING', url: 'http://twitch.tv/denzaiyy' });
		//client.user.setStatus('idle');
		console.log(`Connecter en tant que ${client.user.tag}`);
	},
};
