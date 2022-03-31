const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Répond avec la liste de toute les commandes disponnible avec le bot'),
    async execute(interaction) {
            const embed = new MessageEmbed()
                .setColor('#BF1C1C')
                .setTitle('Commande disponible')
                .setAuthor('denZ-BOT', 'https://cdn.discordapp.com/avatars/841732699529019393/45e2b6ed8372a1f84f93ecd65b883f14.png', 'https://discord.com/api/oauth2/authorize?client_id=841732699529019393&permissions=8&scope=bot')
                .setDescription('Tu as ci-dessous la liste de toute les commandes "/" disponnible sur le serveur!')
                .addFields(
                    { name: 'info user', value: '```Cette commande permet de connaître les informations te concernant. (tag/id/avatar)```' },
                    { name: 'info user target', value: '```Cette commande permet de connaître les informations du membre mentionner à l\'aide du paramètre "target". (tag/id/avatar)```'},
                    { name: 'info server', value: '```Cette commande permet de connaître le nom du serveur ainsi que le nombres de membres.```'}
                )
                .setTimestamp()
                .setFooter(`denz-BOT - Liste de commande `, 'https://cdn.discordapp.com/avatars/841732699529019393/45e2b6ed8372a1f84f93ecd65b883f14.png');
                await interaction.reply({embeds: [embed], ephemeral: true})
    },
};