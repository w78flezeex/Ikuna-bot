const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { money, shop, economy_settings, purchase } = require('../../mongoDB');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Купить товар из магазина')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Название товара для покупки')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('Количество товара для покупки')
        .setRequired(true)
    ),
  async execute(interaction) {
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    try {
      // Находим данные о балансе пользователя в базе данных
      const userBalanceData = await money.findOne({ guildID: guildId, userID: userId });

      // Если запись не найдена, сообщаем пользователю, что у него нет баланса
      if (!userBalanceData) {
        return interaction.reply('У вас нет денег на балансе.');
      }

      // Находим данные о магазине для данного сервера в базе данных
      const serverShopData = await shop.findOne({ guildID: guildId });
      const currencySymbolData = await economy_settings.findOne({ guildID: guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      if (!serverShopData || !serverShopData.items) {
        return interaction.reply('Магазин на данном сервере не установлен.');
      }

      const itemToBuy = interaction.options.getString('item');
      const selectedItem = serverShopData.items.find(item => item.title === itemToBuy);

      if (!selectedItem) {
        return interaction.reply('Такого товара в магазине нет.');
      }

      const userBalance = parseInt(userBalanceData.handBalance);
      const quantityToBuy = interaction.options.getInteger('quantity');

      // Проверяем, хватает ли у пользователя денег
      if (userBalance < selectedItem.price * quantityToBuy) {
        return interaction.reply('У вас недостаточно денег для покупки этого количества товара.');
      }

      // Обновляем баланс пользователя после покупки
      userBalanceData.handBalance -= selectedItem.price * quantityToBuy;

      // Уменьшаем количество товара в магазине после покупки
      if (selectedItem.quantity && selectedItem.quantity >= quantityToBuy) {
        selectedItem.quantity -= quantityToBuy;
      } else {
        // Если у товара количество меньше запрошенного количества или не задано, удаляем товар из магазина
        serverShopData.items = serverShopData.items.filter(item => item.title !== itemToBuy);
      }

      // Создаем запись о покупке и добавляем в базу данных
      const newPurchase = new purchase({
        userID: userId, // Добавляем ID пользователя, который купил товар
        guildID: guildId, // Добавляем ID сервера
        title: selectedItem.title,
        price: selectedItem.price,
        quantity: quantityToBuy,
        date: new Date().toLocaleDateString('ru-RU'), // Форматируем дату в формат ДД.ММ.ГГГГ
      });
      await newPurchase.save();

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('🛒 **Успешная покупка**')
        .setDescription(`Вы успешно приобрели: "${selectedItem.title}" за ${selectedItem.price * quantityToBuy} ${currencySymbol}, ${quantityToBuy} шт. товара.`);

      // Добавляем описание товара, если оно существует
      if (selectedItem.description) {
        embed.addFields({ name: 'Описание', value: selectedItem.description });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при покупке товара:', error.message);
      await interaction.reply('Произошла ошибка при покупке товара. Пожалуйста, попробуйте еще раз позже.');
    }
  },
};
