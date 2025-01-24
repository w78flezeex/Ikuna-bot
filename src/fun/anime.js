const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anime')
    .setDescription('Милая аниме картинка.'),
  async execute(interaction) {
    try {
      // Отправляем запрос к API для получения случайной аниме картинки
      const response = await axios.get('https://nekos.life/api/v2/img/neko');
      const data = response.data;

      const imageUrl = data.url;

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('Милая аниме картинка')
        .setImage(imageUrl);

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply('Произошла ошибка при получении аниме изображения.');
    }
  },
};
