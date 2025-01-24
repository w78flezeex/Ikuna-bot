const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { money, economy_settings } = require('../../mongoDB'); // Импортируем модель Money из файла models.js
const { embedcolor } = require('../../config.json');

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Попытаться ограбить участника и украсть деньги')
    .addUserOption((option) =>
      option.setName('target').setDescription('Участник для ограбления').setRequired(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const targetUser = interaction.options.getMember('target');
    const guildId = interaction.guildId;

    // Проверяем, если цель - это бот или сам пользователь
    if (targetUser.user.bot || targetUser.id === userId) {
      return interaction.reply('Вы не можете ограбить этого участника.');
    }

    try {
      const userBalanceData = await getOrCreateMoneyEntry(userId, guildId);
      const targetBalanceData = await getOrCreateMoneyEntry(targetUser.id, guildId);
      const currencySymbolData = await economy_settings.findOne({ guildID: guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      const userHandBalance = userBalanceData.handBalance || 0;
      const targetHandBalance = targetBalanceData.handBalance || 0;

      // Проверяем, есть ли у пользователя достаточно денег на руках для ограбления
      if (userHandBalance <= 0) {
        return interaction.reply('У вас нет денег на руках для ограбления.');
      }

      // Проверяем, есть ли у жертвы денег на руках
      if (targetHandBalance < 1) {
        return interaction.reply('У этого участника нет денег на руках для ограбления.');
      }

      const now = Date.now();
      const cooldownKey = `${guildId}-${userId}`;
      const cooldownTime = cooldowns.get(cooldownKey) || 0;

      if (now < cooldownTime) {
        const remainingCooldown = cooldownTime - now;
        const minutes = Math.floor(remainingCooldown / 60000);
        const seconds = Math.floor((remainingCooldown % 60000) / 1000);
        const remainingTimeMessage = `${minutes} минут ${seconds} секунд`;
        await interaction.reply(`Вы уже выполнили эту команду. Попробуйте снова через ${remainingTimeMessage}.`);
        return;
      }

      cooldowns.set(cooldownKey, now + 600000); // Устанавливаем кулдаун на 10 минут (600 000 миллисекунд)

      // Вычисляем успешность ограбления (случайное число от 0 до 1)
      const robberySuccess = Math.random() < 0.5; // 50% шанс успеха

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('🏴 **Ограбление**')
        .setDescription(`Вы попытались ограбить ${targetUser.displayName}.`)
        .setThumbnail(interaction.user.displayAvatarURL({ format: 'png' }));

      if (robberySuccess) {
        // Успешное ограбление
        const stolenAmount = Math.floor(targetHandBalance * 0.25); // Украдем 25% от руки цели
        userBalanceData.handBalance += stolenAmount;
        targetBalanceData.handBalance -= stolenAmount;

        // Сохраняем обновленные данные о балансах
        await userBalanceData.save();
        await targetBalanceData.save();

        embed.addFields([{ name: 'Успех!', value: `Вы успешно ограбили ${targetUser.displayName} и украли ${stolenAmount} ${currencySymbol}.` }]);
      } else {
        // Неуспешное ограбление
        embed.addFields([{ name: 'Провал', value: `Попытка ограбления ${targetUser.displayName} провалилась, и вы ничего не украли.` }]);
        
        // Шанс снятия денег с рук грабителя в случае неудачного ограбления
        const lostAmount = Math.floor(Math.random() * 101); // Случайное число от 0 до 100
        if (userHandBalance >= lostAmount) {
          // Снимаем деньги с рук
          userBalanceData.handBalance -= lostAmount;
        } else {
          // Если денег на руках недостаточно, снимаем остаток с банка
          userBalanceData.bankBalance -= (lostAmount - userHandBalance);
          userBalanceData.handBalance = 0;
        }
        await userBalanceData.save();
        embed.addFields([{ name: 'Неудача', value: `Вы потеряли ${lostAmount} ${currencySymbol}.` }]);
      }

      // Устанавливаем timestamp с цветом #FFFAFA
      embed.setTimestamp();

      // Отправляем встроенное сообщение с результатом ограбления
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при попытке ограбления:', error.message);
      await interaction.reply('Произошла ошибка при попытке ограбления.');
    }
  },
};

// Функция для создания или получения записи в базе данных для указанного пользователя и сервера
async function getOrCreateMoneyEntry(userId, guildId) {
  try {
    let userBalanceData = await money.findOne({ userID: userId, guildID: guildId });

    if (!userBalanceData) {
      userBalanceData = await money.create({
        userID: userId,
        guildID: guildId,
        handBalance: 0,
        bankBalance: 0
      });
    }

    return userBalanceData;
  } catch (error) {
    console.error('Произошла ошибка при создании или получении записи в базе данных:', error.message);
    throw new Error('Произошла ошибка при создании или получении записи в базе данных.');
  }
}
