const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hentai')
    .setDescription('Картинка 18+.'),
  async execute(interaction) {
    try {
      // Отправляем запрос к API для получения случайной аниме картинки
      const response = await axios.get('https://danbooru.donmai.us/posts/8396155?q=pussy');
      const data = response.data;

      const imageUrl = data.url;

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('HENTAI')
        .setImage(imageUrl);

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply('Произошла ошибка при получении 18+ изображения.');
    }
  },
};
