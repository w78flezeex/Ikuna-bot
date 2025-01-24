const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { money, economy_settings } = require('../../mongoDB');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('casino')
    .setDescription('Выбей 777 и удвой свою ставку!')
    .addIntegerOption(option =>
      option.setName('ставка')
        .setDescription('Сумма вашей ставки (минимум 100)')
        .setRequired(true)),
  async execute(interaction) {
    const bet = interaction.options.getInteger('ставка');

    if (isNaN(bet) || bet < 100) {
      return interaction.reply('Минимальная сумма ставки 100 монет.');
    }

    try {
      // Получаем текущий баланс пользователя из базы данных
      const userMoney = await money.findOne({ userID: interaction.user.id });
      const currencySymbolData = await economy_settings.findOne({ guildID: interaction.guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      if (!userMoney || userMoney.handBalance < bet) {
        return interaction.reply('У вас недостаточно денег для этой ставки.');
      }

      // Логика игры в рулетку
      const result = Math.random() <= 0.25; // 25% шанс выигрыша

      let winnings = 0;

      if (result) {
        winnings = bet * 2; // Если выигрыш, удваиваем ставку
      } else {
        winnings = -bet; // Если проигрыш, теряем ставку
      }

      // Обновляем баланс пользователя в базе данных
      await money.updateOne({ userID: interaction.user.id }, { $inc: { handBalance: winnings } });

      const newBalance = userMoney.handBalance + winnings;

      const embed = new EmbedBuilder()
        .setTitle('Рулетка')
        .setDescription(`Вы поставили ${bet} ${currencySymbol}`)
        .addFields(
          { name: 'Результат', value: result ? 'Вы выиграли!' : 'Вы проиграли.' },
          { name: 'Выигрыш / Проигрыш', value: winnings > 0 ? `Выигрыш: ${winnings} ${currencySymbol}` : `Проигрыш: ${-winnings} ${currencySymbol}` },
          { name: 'Новый баланс', value: `${newBalance} ${currencySymbol}` }
        )
        .setColor(result ? '#00FF00' : '#FF0000');

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при выполнении команды рулетки:', error);
      interaction.reply('Произошла ошибка при выполнении команды рулетки. Пожалуйста, попробуйте еще раз позже.');
    }
  },
};
