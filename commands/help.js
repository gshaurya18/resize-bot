const config = require('../config.json');
module.exports = {
	name: 'help',
	description: 'Summarizes usage of commands supported by the bot',
	execute(message) {
		message.channel.send(`Please attach an image and use \`${config.prefix}resize NEW_WIDTH [NEW_HEIGHT]\``);
	},
};