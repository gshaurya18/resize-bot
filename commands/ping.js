module.exports = {
	name: 'ping',
	description: 'Checks Bot is online',
	usage: 'ping',
	execute(message) {
		message.channel.send('Pong.');
	},
};