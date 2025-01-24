const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { embedcolor } = require('../../config.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Показать пинг бота'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(embedcolor)
      .setTitle('Пинг бота');

    const ping = Date.now() - interaction.createdTimestamp;

    embed.setDescription(`Задержка API: ${ping} мс\nЗадержка шлюза: ${interaction.client.ws.ping} мс`);

    await interaction.reply({ embeds: [embed] });
  },
};
