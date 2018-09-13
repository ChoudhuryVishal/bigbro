const { MessageEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');

const { client, addFooter } = require('../..');

const clockEmojis = ['🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦'];

module.exports = class UptimeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'uptime',
			group: 'util',
			memberName: 'uptime',
			description: 'Time since bot last restarted.'
		});
	}

	run(msg) {
		const milliseconds = new Date(client.uptime);

		let seconds = Math.floor(milliseconds / 1000);
		let minutes = Math.floor(seconds / 60);
		let hours = Math.floor(minutes / 60);
		let days = Math.floor(hours / 24);

		seconds %= 60;
		minutes %= 60;
		hours %= 24;

		const uptime = [];
		if (days) {
			uptime.push(formatTime(days, 'day'));
		}
		if (hours) {
			uptime.push(formatTime(hours, 'hour'));
		}
		if (minutes) {
			uptime.push(formatTime(minutes, 'minute'));
		}
		if (seconds) {
			uptime.push(formatTime(seconds, 'second'));
		}
		let emojis = Array(days + 1).join('📆');
		if (hours >= 12) {
			emojis += clockEmojis[0];
			hours -= 12;
		}
		const halfHours = 2 * hours + Math.floor(minutes / 30);
		if (halfHours) {
			emojis += clockEmojis[halfHours];
		}
		const embed = new MessageEmbed()
			.setColor('RANDOM')
			.setDescription(`${emojis}\n${uptime.join(', ')}`);
		msg.channel.send({embed})
			.then(reply => addFooter(msg, embed, reply))
			.catch(console.error);
	}
};

const formatTime = (time, unit) => `${time} ${unit}${(time == 1) ? '' : 's'}`;
