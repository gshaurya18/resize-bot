const { AttachmentBuilder } = require('discord.js');
module.exports = {
	name: 'avatar',
	description: 'Sends a picture of the user\'s avatar',
	usage: 'avatar',
	execute(message) {
		const url = message.author.displayAvatarURL({ format: 'jpeg' });
		const attachment = new AttachmentBuilder(url);
		message.channel.send({ files: [attachment] });
	},
};