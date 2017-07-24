const Discord = require('discord.js');
const mongodb = require('mongodb');

const messages = require('./messages');

const client = new Discord.Client();
const MongoClient = new mongodb.MongoClient();
const token = process.env.BIGBRO_TOKEN;
const [mongodbUri, username, password, host, port, database] = process.env.BIGBRO_DB.match(/^(?:mongodb:\/\/)(.+):(.+)@(.+):(.+)\/(.+)$/);
const db = new mongodb.Db(database, new mongodb.Server(host, Number(port)));
const prefix = '%';
const commandInfo = {
	ping: 'Pong!',
	uptime: 'Time since bot last restarted.',
	leaderboard: 'Get users with the most messages on the server.'
};
const commands = {};

let helpDescription = `\`${prefix}help\`: Provides information about all commands.`;

const handleCommand = message => {
	const [cmd, args] = message.content.substring(prefix.length).split(' ', 2);
	const author = message.member ? message.member.displayName : message.author.username;
	const embed = new Discord.RichEmbed()
		.setFooter(`Triggered by ${author}`, message.author.displayAvatarURL)
		.setTimestamp(message.createdAt);

	if (commands.hasOwnProperty(cmd)) {
		commands[cmd](message, args, embed);
	} else if (cmd == 'help') {
		embed.setColor('RANDOM').setTitle('Commands').setDescription(helpDescription);
		message.channel.send({embed});
	}
}

client.on('ready', () => {
	console.log('Ready!');
	//messages.update();
});

client.on('error', console.error);

client.on('message', message => {
	if (message.content.startsWith(prefix)) {
		handleCommand(message);
	}
	messages.upsertMessageInDb(message, false);
});

client.on('messageUpdate', message => {
	messages.upsertMessageInDb(message, false);
});

client.on('messageDelete', message => {
	messages.upsertMessageInDb(message, true);
});

client.on('messageDeleteBulk', messageCollection => {
	messageCollection.forEach(message => messages.upsertMessageInDb(message, true));
});

db.open()
	.then(db => db.authenticate(username, password))
	.then(db => {
		Object.keys(commandInfo).forEach(name => commands[name] = require('./commands/' + name));
		Object.entries(commandInfo).forEach(([name, desc]) => {
			helpDescription += `\n\`${prefix}${name}\`: ${desc}`;
		});
		client.login(token).catch(console.error);
	}).catch(console.error);

module.exports.client = client;
module.exports.db = db;
