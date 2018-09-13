const { MessageEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');

const { db, addFooter } = require('../..');
const { leaderboardChannels } = require('../../messages');

const statusEmojis = {
	'online': '<:online:462707431865188354>',
	'offline': '<:offline:462707499133304842>',
	'idle': '<:idle:462707524869816330>',
	'dnd': '<:dnd:462707542389161994>',
	'streaming': '<:streaming:462707566552547369>',
	'invisible': '<:invisible:462707587570204682>'
};

module.exports = class ProfileCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'profile',
			group: 'users',
			memberName: 'profile',
			description: 'Information about a user.',
			args: [
				{
					key: 'member',
					label: 'user',
					prompt: 'What user would you like information about?',
					type: 'member',
					default: ''
				}
			]
		});
	}

	async run(msg, { member }) {
		let user;
		if (!member) {
			user = msg.author;
			member = msg.member;
		} else {
			user = msg.mentions.users.first();
			member = msg.mentions.members ? msg.mentions.members.first() : null;
		}
		if (!user) {
			return msg.reply('please mention a user to obtain their profile.').catch(console.error);
		}
		let document;
		try {
			document = msg.guild ? await db.collection('counts').aggregate()
				.match({'_id.guild': msg.guild.id, '_id.channel': {$in: leaderboardChannels}, '_id.user': user.id})
				.group({_id: '$_id.user', count: {$sum: '$count'}})
				.next() : null;
		} catch (err) {
			console.error(err);
		}
		const game = user.presence.game;
		const joinedDiscord = getDaysAgo(user.createdAt);
		const joinedServer = member ? getDaysAgo(member.joinedAt) : null;
		const messageCount = document ? document.count : 0;
		const roles = member && member.roles.size > 1 ? member.roles.array().filter(role => role.id !== msg.guild.id).sort((a, b) => b.comparePositionTo(a)).join(', ') : null;
		let status = user.presence.status;
		if (status === 'dnd') {
			status = 'Do Not Disturb';
		} else {
			status = status.charAt(0).toUpperCase() + status.slice(1);
		}
		status = `${statusEmojis[user.presence.status]} ${status}`;
		const embed = new MessageEmbed()
			.setColor(member ? member.displayColor : 0xffffff)
			.setAuthor(member ? member.displayName : user.username, user.displayAvatarURL())
			.setImage(user.displayAvatarURL({size: 2048}))
			.addField('Status', status, true)
			.addField('Joined Discord', joinedDiscord, true);
		if (member) {
			embed.addField('Joined Server', joinedServer, true);
			embed.addField('Messages', messageCount, true);
		}
		if (roles) {
			embed.addField('Roles', roles, true);
		}
		if (game) {
			embed.addField('Playing', game.name, true);
			if (game.url) {
				embed.addField('Streaming', game.url, true);
			}
		}
		msg.channel.send({embed}).then(reply => addFooter(msg, embed, reply)).catch(console.error);
	}
};

const getDaysAgo = timestamp => `${Math.floor((Date.now() - timestamp) / 86400000)} days ago`;
