const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { shop, economy_settings } = require('../../mongoDB'); // Импортируем модели Shop и economy_settings
const { embedcolor } = require('../../config.json'); // Импортируем цвет для embed сообщений из конфигурации

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Просмотреть товары в магазине'),
  async execute(interaction) {
    const guildId = interaction.guildId;

    try {
      // Находим данные о магазине для данного сервера
      const shopData = await shop.findOne({ guildID: guildId });
      if (!shopData || !shopData.items || shopData.items.length === 0) {
        return interaction.reply('Магазин на данном сервере не установлен.');
      }

      // Находим данные о валюте для данного сервера
      const currencySymbolData = await economy_settings.findOne({ guildID: interaction.guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      // Получаем название сервера
      const guild = interaction.guild;
      const serverName = guild.name;

      // Создаем embed сообщение
      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle(`🛒 **Магазин "${serverName}"**`)
        .setDescription('Доступные товары в магазине:');

      // Добавляем товары в embed сообщение
      shopData.items.forEach((item, index) => {
        const itemTitle = item.title || 'Нет названия';
        const itemDescription = item.description || 'Нет описания';
        const itemPrice = item.price || 0; // Предполагается, что 0 будет использоваться, если цена не определена
        const itemQuantity = item.quantity || '♾️'; // Предполагается, что '♾️' будет использоваться для неограниченного количества

        // Добавляем информацию о товаре в embed сообщение
        embed.addFields([
          { name: `Товар: **${itemTitle}**`, value: `Описание: ${itemDescription}\nЦена: ${itemPrice} ${currencySymbol}\nКоличество: ${itemQuantity}` }
        ]);
      });

      // Отправляем embed сообщение
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при загрузке данных магазина:', error.message);
      await interaction.reply('Произошла ошибка при загрузке магазина.');
    }
  },
};
