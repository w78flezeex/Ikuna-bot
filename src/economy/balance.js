const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { money, economy_settings } = require('../../mongoDB');
const { embedcolor } = require('../../config.json');

// Функция для конвертации миллисекунд в часы, минуты и секунды
function convertMillisecondsToTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return { hours, minutes, seconds };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Просмотреть баланс на руках и в банке')
    .addUserOption(option =>
      option.setName('пользователь')
        .setDescription('Пользователь, баланс которого вы хотите увидеть')
        .setRequired(false)),
  async execute(interaction) {
    const userId = interaction.options.getUser('пользователь')?.id || interaction.user.id;
    const guildId = interaction.guildId;

    try {
      // Ищем запись о балансе пользователя в базе данных
      let userBalanceData = await money.findOne({ guildID: guildId, userID: userId });
      let currencyData = await economy_settings.findOne({ guildID: guildId });

      // Если пользователь не найден, создаем запись
      if (!userBalanceData) {
        userBalanceData = await money.create({
          handBalance: 0, // Начальное значение баланса
          bankBalance: 0, // Можно добавить начальное значение баланса на банковском счете, если нужно
          userID: userId,
          guildID: interaction.guildId,
          status: '', // Можно добавить другие поля, если нужно
          percentage: '', // Например, статус, проценты и т.д.
        });
      }

      // Получаем данные о балансе пользователя
      const handBalance = userBalanceData.handBalance || 0;
      const bankBalance = userBalanceData.bankBalance || 0;
      const currencySymbol = currencyData?.currencySymbol || '💵';
      
      let additionalIncome = "";
      
      // Проверяем, установлены ли переменные percentage и time
      if (userBalanceData.percentage && userBalanceData.time) {
        additionalIncome = ` + доход ${userBalanceData.percentage}% каждые ${convertMillisecondsToTime(userBalanceData.time).hours} часов ${convertMillisecondsToTime(userBalanceData.time).minutes} минут ${convertMillisecondsToTime(userBalanceData.time).seconds} секунд`;
      } else {
        additionalIncome = "Дополнительного дохода нет";
      }
      
      // Создаем встроенное сообщение (embed) с информацией о балансе
      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle(`💰 **Кошелёк ${interaction.guild.members.cache.get(userId).displayName}**`)
        .addFields(
          { name: 'На руках:', value: `${handBalance} ${currencySymbol}` },
          { name: 'В банке:', value: `${bankBalance} ${currencySymbol} | ${additionalIncome}` }
        )
        .setThumbnail(interaction.guild.members.cache.get(userId).user.displayAvatarURL({ format: 'png' })) // Добавляем аватар автора в виде миниатюры
        .setFooter({ text: `Баланс пользователя ${interaction.guild.members.cache.get(userId).displayName}.`, iconURL: interaction.guild.members.cache.get(userId).user.displayAvatarURL({ format: 'png' }) })
        .setTimestamp();

      // Отправляем встроенное сообщение с балансом
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при получении баланса из базы данных:', error.message);
      // Обработка ошибок, если что-то пошло не так при доступе к базе данных
      await interaction.reply('Произошла ошибка при получении баланса. Пожалуйста, попробуйте еще раз позже.');
    }
  },
};
