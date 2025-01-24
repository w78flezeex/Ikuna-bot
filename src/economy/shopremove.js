const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { shop } = require('../../mongoDB');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shopremove')
    .setDescription('Удалить товар из магазина')
    .addStringOption(option =>
      option.setName('название_товара')
        .setDescription('Название товара для удаления')
        .setRequired(true)
    ),
  async execute(interaction) {
    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!isAdmin) {
      return interaction.reply('У вас нет разрешения на выполнение этой команды.');
    }

    const guildId = interaction.guildId;
    const title = interaction.options.getString('название_товара');

    try {
      const shopData = await shop.findOne({ guildID: guildId });
      if (!shopData || !shopData.items || shopData.items.length === 0) {
        return interaction.reply('Магазин пуст, нет товаров для удаления.');
      }

      const itemIndex = shopData.items.findIndex(item => item.title === title);

      if (itemIndex === -1) {
        return interaction.reply('Такого товара нет в магазине.');
      }

      const removedItem = shopData.items.splice(itemIndex, 1)[0];
      await shopData.save();

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('🛒 **Товар удален**')
        .setDescription(`Товар "${removedItem.title}" успешно удален из магазина.`);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при удалении товара из магазина:', error.message);
      await interaction.reply('Произошла ошибка при удалении товара из магазина.');
    }
  },
};
