const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { money, economy_settings } = require('../../mongoDB'); // Импортируем модель Money из файла models.js
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Отправить деньги другому участнику')
    .addUserOption(option =>
      option.setName('получатель')
        .setDescription('Участник, которому вы хотите отправить деньги')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('сумма')
        .setDescription('Количество денег, которое вы хотите отправить')
        .setRequired(true)),
  async execute(interaction) {
    const senderId = interaction.user.id;
    const receiverId = interaction.options.getUser('получатель').id;
    const amount = interaction.options.getInteger('сумма');
    const guildId = interaction.guildId;

    // Создаем записи для отправителя и (или) получателя, если их нет в базе данных
    await createOrUpdateMoneyEntry(senderId, guildId);
    await createOrUpdateMoneyEntry(receiverId, guildId);

    try {
      const senderData = await money.findOne({ userID: senderId, guildID: guildId }); // Получаем данные отправителя из базы данных
      const receiverData = await money.findOne({ userID: receiverId, guildID: guildId }); // Получаем данные получателя из базы данных
      const currencySymbolData = await economy_settings.findOne({ guildID: guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      // Проверка на попытку отправить деньги самому себе
      if (senderId === receiverId) {
        return interaction.reply('Вы не можете отправить деньги самому себе.');
      }

      if (amount <= 0 || senderData.handBalance < amount) {
        console.log('Недостаточно средств или неверная сумма.');
        return interaction.reply('Недостаточно средств или неверная сумма.');
      }

      // Уменьшаем баланс отправителя и увеличиваем баланс получателя
      senderData.handBalance -= amount;
      receiverData.handBalance += amount;

      // Сохраняем изменения в базе данных
      await senderData.save();
      await receiverData.save();

      const senderName = interaction.member.displayName;
      const receiverName = interaction.options.getMember('получатель').displayName;
      
      // Создаем embed сообщение для отправителя
      const senderEmbed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('💸 **Перевод**')
        .setDescription(`Вы перевели ${receiverName} ${amount} ${currencySymbol}`)
        .setFooter({ text: 'Спасибо за вашу щедрость!' })
        .setTimestamp();
      
      // Создаем embed сообщение для отправителя
      const receiverEmbed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('💸 **Кошелёк**')
        .setDescription(`${senderName} перевёл вам ${amount} ${currencySymbol}`)
        .setTimestamp();

      // Отправляем embed сообщения в личные сообщения отправителю и получателю
      await interaction.reply({ embeds: [senderEmbed] });
      await interaction.options.getUser('получатель').send({ embeds: [receiverEmbed] });

    } catch (error) {
      console.error('Произошла ошибка при выполнении команды pay:', error.message);
      await interaction.reply('Произошла ошибка при обработке вашего запроса.');
    }
  },
};

// Функция для создания или обновления записи в базе данных для указанного пользователя и сервера
async function createOrUpdateMoneyEntry(userId, guildId) {
  try {
    const existingEntry = await money.findOne({ userID: userId, guildID: guildId });

    if (!existingEntry) {
      await money.create({
        userID: userId,
        guildID: guildId,
        handBalance: 0,
        bankBalance: 0
      });
    }
  } catch (error) {
    console.error('Произошла ошибка при создании или обновлении записи в базе данных:', error.message);
  }
}
