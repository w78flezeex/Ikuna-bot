const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { shop, economy_settings } = require('../../mongoDB'); // Импортируем модель Shop из ваших моделей
const { embedcolor } = require('../../config.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shopadd')
    .setDescription('Добавить товары в магазин')
    .addStringOption(option =>
      option.setName('товар')
        .setDescription('Товары для добавления (можно указывать через запятую (роль1,роль2))')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('описание')
        .setDescription('Описания товаров (можно указывать через запятую (дешёвая роль1,дешёвая роль2))')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('цена')
        .setDescription('Цены на товары (можно указывать через запятую (10,50))')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('количество')
        .setDescription('Количество товаров (можно указывать через запятую (1,5))')
    ),
  async execute(interaction) {
    const isAdmin = interaction.member.permissions.has('ADMINISTRATOR');

    if (!isAdmin) {
      return interaction.reply('У вас нет разрешения на выполнение этой команды.');
    }

    const guildId = interaction.guildId;
    const items = interaction.options.getString('товар').split(',');
    const descriptions = interaction.options.getString('описание').split(',');
    const prices = interaction.options.getString('цена').split(',');
    const quantities = (interaction.options.getString('количество') || '').split(',');

    if (items.length !== descriptions.length || items.length !== prices.length) {
      return interaction.reply('Количество товаров, описаний и цен должно совпадать.');
    }

    if (quantities.length > 0 && items.length !== quantities.length) {
      return interaction.reply('Если указано количество товаров, оно должно соответствовать количеству товаров.');
    }

    try {
      let serverShopData = await shop.findOne({ guildID: guildId });

      if (!serverShopData) {
        serverShopData = await shop.create({ guildID: guildId, items: [] });
      }

      // Получаем символ валюты из настроек экономики для данного сервера
      const currencySymbolData = await economy_settings.findOne({ guildID: interaction.guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      for (let i = 0; i < items.length; i++) {
        const quantity = quantities[i] ? parseInt(quantities[i].trim()) : Infinity;
        serverShopData.items.push({
          title: items[i].trim(),
          description: descriptions[i].trim(),
          price: prices[i].trim(),
          quantity,
        });
      }

      await serverShopData.save();

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('🛒 **Товары добавлены**')
        .setDescription('Товары успешно добавлены в магазин.');

      items.forEach((item, index) => {
        embed.addFields([{ name: `Товар: **${item}**`, value: `Описание: ${descriptions[index]}\nЦена: ${prices[index]} ${currencySymbol}\nКоличество: ${quantities[index] || '♾️'}` }]);
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при добавлении товаров в магазин:', error.message);
      await interaction.reply('Произошла ошибка при добавлении товаров в магазин. Пожалуйста, попробуйте еще раз позже.');
    }
  },
};
