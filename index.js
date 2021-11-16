require('dotenv').config()

const { Client, Collection, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

client.on('ready', () =>{
    console.log(`Connecter en tant que ${client.user.tag} !`);
})

client.login(process.env.BOT_TOKEN)