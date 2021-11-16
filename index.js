require('dotenv').config()

const { Client, Collection, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

const BOT_PREFIX = "!d"

client.on('ready', () =>{
    console.log(`Connecter en tant que ${client.user.tag} !`);
})

client.on("message", msg =>{
    if(msg.content === `${BOT_PREFIX} + " " + "test"`){
        msg.reply("this is a test!")
    }
})

client.login(process.env.BOT_TOKEN)