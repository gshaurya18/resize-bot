const Discord = require('discord.js');
module.exports = {
	name: 'avatar',
	description: 'Sends a picture of the user\'s avatar',
	execute(message) {
		const url = message.author.displayAvatarURL({ format: 'jpeg' });
		const attachment = new Discord.MessageAttachment(url);
		message.channel.send(attachment);
	},
};