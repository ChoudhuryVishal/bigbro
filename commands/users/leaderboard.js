const { MessageEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');

const { db, client, addFooter } = require('../..');
const { leaderboardChannels } = require('../../messages');

const rankEmojis = ['🥇', '🥈', '🥉'];
const pageSize = 10;
const previous = '🔺';
const next = '🔻';

module.exports = class LeaderboardCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'leaderboard',
			aliases: ['lead'],
			group: 'users',
			memberName: 'leaderboard',
			description: 'Users with the most messages in the server.',
			guildOnly: true
		});
	}

	async run(msg) {
		let leaderboard;
		try {
			leaderboard = await db.collection('counts').aggregate()
				.match({'_id.guild': msg.guild.id, '_id.channel': {$in: leaderboardChannels}})
				.group({_id: '$_id.user', count: {$sum: '$count'}})
				.sort({count: -1})
				.toArray();
		} catch (err) {
			console.error(err);
		}
		const embed = new MessageEmbed()
			.setColor('RANDOM')
			.setTitle('Users with no lives:')
			.setDescription(getDescription(leaderboard));

		let reply;
		try {
			reply = await msg.channel.send({embed: embed});
		} catch (err) {
			console.error(err);
		}
		let index = 0;
		const collector = reply.createReactionCollector((reaction, user) => {
			return user.id !== client.user.id && (reaction.emoji.name === previous || reaction.emoji.name === next);
		}, {time: 30000, dispose: true});
		collector.on('collect', (reaction, user) => {
			if (user.id === msg.author.id) {
				index += (reaction.emoji.name === next ? 1 : -1) * pageSize;
				if (index >= leaderboard.length) {
					index = 0;
				} else if (index < 0) {
					index = Math.max(leaderboard.length - pageSize, 0);
				}
				reply.edit({embed: embed.setDescription(getDescription(leaderboard, index))});
			} else {
				reaction.users.remove(user);
			}
		});
		collector.on('remove', (reaction, user) => {
			if (user.id === msg.author.id) {
				index += (reaction.emoji.name === next ? 1 : -1) * pageSize;
				if (index >= leaderboard.length) {
					index = 0;
				} else if (index < 0) {
					index = Math.max(leaderboard.length - pageSize, 0);
				}
				reply.edit({embed: embed.setDescription(getDescription(leaderboard, index))});
			}
		});
		collector.on('end', () => {
			let users = reply.reactions.get(next).users;
			users.forEach(user => users.remove(user));
			users = reply.reactions.get(previous).users;
			users.forEach(user => users.remove(user));
			addFooter(msg, embed, reply);
		});
		try {
			await reply.react(previous);
		} catch (err) {
			console.error(err);
		}
		try {
			await reply.react(next);
		} catch (err) {
			console.error(err);
		}
	}
};

const getDescription = (users, index = 0) => {
	let description = '';
	for (let i = index; i < users.length && i < (index + pageSize); i++) {
		const user = users[i];
		let rank = i + 1;
		rank = (rank < 4) ? `${rankEmojis[rank - 1]}  ` : `**\`#${String(rank).padEnd(3)}\u200B\`**`;
		description += `${rank} <@${user._id}> \`${user.count} messages\`\n`;
	}
	return description;
};
