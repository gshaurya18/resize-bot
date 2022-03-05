const fs = require('fs');
const config = require('../config.json');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const { MessageEmbed } = require('discord.js');
module.exports = {
	name: 'help',
	description: 'Summarizes usage of commands supported by the bot',
	usage: 'help',
	execute(message) {
		let msg = ' ';
		for (const file of commandFiles) {
			const command = require(`../commands/${file}`);
			msg += `**${command.name}:** *${command.description}*\nUsage: \`${config.prefix}${command.usage}\`\n\n`;
		}
		msg = msg.slice(0, -1);
		const embed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Help')
			.setURL('https://github.com/gshaurya18/resize-bot')
			.setDescription(msg)
			.setTimestamp();
		message.channel.send(embed).catch(console.error);
		// message.channel.send(`\`resize: \` \`${config.prefix}resize NEW_WIDTH [NEW_HEIGHT]\``);
	},
};