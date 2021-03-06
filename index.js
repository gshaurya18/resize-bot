const fs = require('fs');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.message] });
client.commands = new Collection();

// Read names of command files (ending with .js)
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Set commands to collection
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}

client.once('ready', () => {
	// Log to the terminal when bot has succesfully logged in
	console.log('Ready!');
});

client.on('messageCreate', async message => {
	// Ignore messages that dont start with `prefix` or are sent by a bot
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	// Seperate message into command and array of arguments (if any)
	const args = message.content.slice(config.prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();
	// Invalid command
	if (!client.commands.has(command)) return;

	// Try to get and execute a valid command
	try {
		client.commands.get(command).execute(message, args);
	}
	catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!');
	}
});

client.login(config.token);