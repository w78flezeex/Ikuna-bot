const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { money, economy_settings } = require('../../mongoDB'); // Импортируем модель Money из файла models.js
const { embedcolor } = require('../../config.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Положить деньги в банк')
    .addIntegerOption(option =>
      option.setName('сумма')
        .setDescription('Сумма, которую вы хотите положить в банк')
        .setRequired(true)),
  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    const depositAmount = interaction.options.getInteger('сумма');

    if (depositAmount <= 0) {
      return interaction.reply('Сумма должна быть положительной.');
    }

    try {
      let userMoney = await money.findOne({ userID: userId, guildID: guildId }); // Находим данные о деньгах пользователя
      if (!userMoney) {
        userMoney = await money.create({ userID: userId, guildID: guildId }); // Если данных нет, создаем новую запись
      }

      if (userMoney.handBalance < depositAmount) {
        return interaction.reply('У вас недостаточно денег на руках для этой операции.');
      }

      userMoney.handBalance -= depositAmount;
      userMoney.bankBalance += depositAmount;

      await userMoney.save(); // Сохраняем обновленные данные о деньгах пользователя

      const currencySymbolData = await economy_settings.findOne({ guildID: interaction.guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('💰 **Депозит**')
        .setDescription(`Вы положили ${depositAmount} ${currencySymbol} в банк.`)
        .addFields(
          { name: 'На руках:', value: `${userMoney.handBalance >= 0 ? userMoney.handBalance : 0} ${currencySymbol}` },
          { name: 'В банке:', value: `${userMoney.bankBalance} ${currencySymbol}` }
        )
        .setThumbnail(interaction.user.displayAvatarURL({ format: 'png' }))
        .setFooter({ text: 'Обновленный баланс.', iconURL: interaction.user.displayAvatarURL({ format: 'png' }) })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при выполнении депозита:', error);
      await interaction.reply('Произошла ошибка при выполнении депозита.');
    }
  },
};
