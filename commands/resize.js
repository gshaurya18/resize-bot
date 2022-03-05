const Canvas = require('canvas');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const Discord = require('discord.js');
const IMAGE_FILE_IN = 'myImage.txt';
const IMAGE_FILE_OUT = 'myImage_out.ppm';
// Limit Size to 1000 X 1000
const MAX_IMAGE_WIDTH = 1000;
const MAX_IMAGE_HEIGHT = 1000;

// Check if attachment is an image or not
function attachIsImage(message) {
	const link = message.attachments.first().url;
	return link.endsWith('.jpeg') || link.endsWith('.png');
}
module.exports = {
	name: 'resize',
	description: 'resizes image using seam carving',
	usage: 'resize WIDTH [HEIGHT]',
	async execute(message, args) {
		// Check for attachments
		let ImageLink = '';
		let height = 0;
		let width = 0;
		// In case of no attachments get last sent image
		if (message.attachments.size === 0) {
			// return message.reply('Please attach an image.\n`Usage: resize WIDTH [HEIGHT] ATTACH_IMAGE`');
			const attachment = await message.channel.messages.fetch().then((messages) => {
				const lastMessage = messages.sort((a, b) => b.createdTimestamp - a.createdTimestamp).filter((m) => m.attachments.size > 0).find(attachIsImage);
				if (typeof lastMessage === 'undefined') {
					return lastMessage;
				}
				return lastMessage.attachments.first();
			});

			if (typeof attachment === 'undefined') {
				return message.reply('Please attach an image \n`Usage: resize WIDTH [HEIGHT] ATTACH_IMAGE`');
			}
			ImageLink = attachment.url;
			height = attachment.height;
			width = attachment.width;
		}
		else {
			ImageLink = message.attachments.first().url;
			height = message.attachments.first().height;
			width = message.attachments.first().width;
		}
		// Check if attachment is an image
		if (!ImageLink.endsWith('.jpeg') && !ImageLink.endsWith('.png')) {
			return message.reply('Attachment must be an image\n`Usage: resize WIDTH [HEIGHT] ATTACH_IMAGE`');
		}

		// Process arguments (1 or 2)
		if (args.length === 0 || args.length > 2) {
			message.channel.send('`Usage: resize WIDTH [HEIGHT] ATTACH_IMAGE`');
			return message.reply(`Your image is ${width} X ${height}`);
		}

		// args should be numbers
		if (isNaN(parseInt(args[0])) || parseInt(args[0]) === 0) return message.reply('Enter a valid number');
		let new_width = parseInt(args[0]);
		let new_height = 0;
		// Default to same height if not specified
		if (args.length === 1) {
			new_height = height;
		}
		else{
			if (isNaN(parseInt(args[1])) || parseInt(args[1]) === 0) return message.reply('Enter a valid number');
			new_height = parseInt(args[1]);
		}

		// Only supports shrinking for now
		if (new_width > width || new_height > height) {
			return message.reply(`Sorry, only shrinking is supported for now!\nYour image is ${width} X ${height}`);
		}

		// Do nothing for same width, height
		if (new_width === width && new_height === height) {
			const attachment = new Discord.MessageAttachment(ImageLink);
			return message.channel.send(`Here is the resized image ${message.author}`, attachment);
		}

		let canvas, context;
		let x = 0;
		let y = 0;
		let scale = 1;
		console.log('Processing Image Data');
		if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
			canvas = Canvas.createCanvas(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT);
			context = canvas.getContext('2d');
			const myImg = await Canvas.loadImage(ImageLink);
			scale = Math.min(canvas.width / width, canvas.height / height);
			// top left of image
			x = (canvas.width / 2) - (width / 2) * scale;
			y = (canvas.height / 2) - (height / 2) * scale;
			context.drawImage(myImg, x, y, width * scale, height * scale);
			new_height *= scale;
			new_width *= scale;
		}
		else {
			canvas = Canvas.createCanvas(width, height);
			context = canvas.getContext('2d');
			const myImg = await Canvas.loadImage(ImageLink);
			context.drawImage(myImg, 0, 0, canvas.width, canvas.height);
		}
		const imgData = context.getImageData(x, y, width * scale, height * scale);

		console.log('Done!');
		// console.log('Image Data as read by Canvas');
		// console.log(imgData.data);
		// write a ppm file
		let content = `P3\n${Math.trunc(width * scale)} ${Math.trunc(height * scale)}\n255\n`;

		// console.log(`Size of data: ${width * height * 4}`);
		console.log('Writing Image Data');
		for (let j = 0; j < imgData.data.length; j += 4) {
			content += `${imgData.data[j]} ${imgData.data[j + 1]} ${imgData.data[j + 2]} `;
		}
		content += '\n';
		console.log('Creating Temp file');
		fs.writeFileSync('myImage.txt', content);
		console.log('Written Image file!');

		// resize.exe is a c++ program that uses seam-carving to resize image to desired dimensions
		// currently only supports shrinking
		console.log('Resizing..');
		const { error, stdout, stderr } = await exec(`./resize.exe ${IMAGE_FILE_IN} ${IMAGE_FILE_OUT} ${new_width} ${new_height}`);
		if (error) {
			return console.log(`error: ${error.message}`);
		}
		if (stderr) {
			return console.log(`stderr: ${stderr}`);
		}
		if (stdout) {
			console.log(`stdout: ${stdout}`);
		}

		// read new image
		// eslint-disable-next-line prefer-const
		let newImgData = context.createImageData(new_width, new_height);
		console.log('Reading new Image File');
		const data = fs.readFileSync(`./${IMAGE_FILE_OUT}`, 'utf8');
		const rgb = data.trim().split(/\s+/);
		for (let i = 0, j = 4; i < newImgData.data.length; i += 4, j += 3) {
			newImgData.data[i] = parseInt(rgb[j]);
			newImgData.data[i + 1] = parseInt(rgb[j + 1]);
			newImgData.data[i + 2] = parseInt(rgb[j + 2]);
			newImgData.data[i + 3] = 255;
		}
		console.log('Read new Image file');

		context.canvas.width = new_width;
		context.canvas.height = new_height;
		context.putImageData(newImgData, 0, 0);

		const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'resized-image.png');

		message.channel.send(`Here is the resized image ${message.author}`, attachment);
		console.log('All Done');
	},
};