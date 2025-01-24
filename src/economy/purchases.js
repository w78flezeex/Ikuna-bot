const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { purchase, economy_settings } = require('../../mongoDB'); // Импортируем модель Purchase из файла models.js
const { embedcolor } = require('../../config.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purchases')
    .setDescription('Просмотреть купленные товары в магазине.'),
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const guildId = interaction.guildId;

      // Находим все покупки пользователя в данном сервере по его ID
      const userPurchases = await purchase.find({ userID: userId, guildID: guildId });
      const currencySymbolData = await economy_settings.findOne({ guildID: guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      if (!userPurchases || userPurchases.length === 0) {
        return interaction.reply('Вы еще не совершили покупок в магазине.');
      }

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('🛒 **Ваши покупки**')
        .setDescription('Список ваших купленных товаров:');

      userPurchases.forEach((purchase, index) => {
        // Формируем текст для каждой покупки
        const purchaseInfo = `Товар: **${purchase.title}**\nЦена: ${purchase.price} ${currencySymbol}\nДата покупки: ${purchase.date}\nКоличество: ${purchase.quantity}`;

        // Добавляем информацию о покупке во встроенное сообщение
        embed.addFields([{ name: `Покупка ${index + 1}`, value: purchaseInfo }]);
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при загрузке данных магазина:', error.message);
      await interaction.reply('Произошла ошибка при загрузке магазина.');
    }
  },
};
