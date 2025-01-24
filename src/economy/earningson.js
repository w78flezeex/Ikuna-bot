const { money } = require('../../mongoDB'); // Подключаем модель Money из файла models.js
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('earningon')
    .setDescription('Установить переменные для увеличения баланса в банке')
    .addStringOption(option =>
      option.setName('статус')
        .setDescription('Статус для увеличения баланса')
        .setRequired(true)
        .addChoices(
          { name: 'Включить', value: 'on' },
          { name: 'Выключить', value: 'off' }
        )),
  async execute(interaction) {
    const guildId = interaction.guildId;
    
    const status = interaction.options.getString('статус');

    const isAdmin = interaction.member.permissions.has('ADMINISTRATOR');

    if (!isAdmin) {
      return interaction.reply('У вас нет разрешения на выполнение этой команды.');
    }

    try {

      // Поиск или создание записи о переменных для пользователя
      let userVariables = await money.findOne({ guildID: guildId });
      if (!userVariables) {
        userVariables = await money.create({ guildID: guildId });
      }

      // Проверка корректности статуса
      if (!['off', 'on'].includes(status)) {
        return interaction.reply('Неверный статус.');
      }

      // Установка новых значений переменных
      userVariables.status = status;

      await userVariables.save();

      return interaction.reply(`Дополнительный заработок переставлен на статус ${status}`);
    } catch (error) {
      console.error('Ошибка при установке переменных:', error);
      return interaction.reply('Произошла ошибка при установке переменных.');
    }
  },
};
