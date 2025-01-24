const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { modembed, embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Временно заглушить участника на сервере')
    .addUserOption(option =>
      option.setName('участник')
        .setDescription('Участник, которого нужно временно заглушить')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('время')
        .setDescription('Время в формате 1н, 1д, 1ч, 1м, 1с')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('причина')
        .setDescription('Причина мьюта (не обязательно)')
        .setRequired(false)
    ),
  async execute(interaction) {
    const member = interaction.member;
    const userToMute = interaction.options.getMember('участник');
    const timeString = interaction.options.getString('время');
    const reason = interaction.options.getString('причина') || 'не указана';

    // Проверяем права пользователя на команду
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply('У вас нет прав на временный мьют участников.');
    }

    // Проверяем, чтобы нельзя было замьютить участников с такой же или более высокой ролью
    if (userToMute.roles.highest.comparePositionTo(interaction.member.roles.highest) >= 0) {
      return interaction.reply('Вы не можете заглушить участника с более высокой или равной ролью.');
    }

    // Проверка корректности участника
    if (!userToMute) {
      return interaction.reply('Участник не найден.');
    }

    // Проверяем, есть ли у участника активный тайм-аут
    if (userToMute.communicationDisabledUntilTimestamp && userToMute.communicationDisabledUntilTimestamp > Date.now()) {
      return interaction.reply('У этого участника уже есть активный тайм-аут.');
    }

    // Парсим время и проверяем его корректность
    let time;
    try {
      time = parseTime(timeString);
    } catch (error) {
      return interaction.reply(`Ошибка: ${error.message}`);
    }

    // Проверяем, если участник имеет права администратора или модератора
    if (
      userToMute.permissions.has(PermissionsBitField.Flags.Administrator) ||
      userToMute.permissions.has(PermissionsBitField.Flags.ModerateMembers)
    ) {
      return interaction.reply('Вы не можете заглушить данного участника.');
    }

    try {
      // Применяем тайм-аут
      await userToMute.timeout(time, reason);

      // Создаем embed сообщение о временной заглушке
      const serverEmbed = new EmbedBuilder()
        .setTitle('Временный мьют')
        .setDescription(`Участник ${userToMute} был успешно временно заглушен на ${formatTime(time)}.`)
        .addFields({ name: 'Причина', value: reason })
        .setColor(modembed);

      // Отправляем embed в канал, где была вызвана команда
      await interaction.reply({ embeds: [serverEmbed] });

      // Пытаемся отправить сообщение пользователю в личные сообщения
      try {
        const userEmbed = new EmbedBuilder()
          .setTitle('Временный Мьют')
          .setDescription(`Вы были временно заглушены на сервере ${interaction.guild.name}.`)
          .addFields({ name: 'Причина', value: reason })
          .setColor(embedcolor);

        await userToMute.send({ embeds: [userEmbed] });
      } catch (sendError) {
        console.error('Ошибка при отправке сообщения пользователю:', sendError);
        // Игнорируем ошибку отправки сообщения пользователю
      }
    } catch (error) {
      console.error('Ошибка при применении тайм-аута:', error);
      // Не отправляем сообщение в ЛС, если мьют не удался
      return interaction.reply('Произошла ошибка при применении тайм-аута.');
    }
  },
};

// Функция для парсинга времени
function parseTime(timeString) {
  const regex = /(\d+)([wdhmsдчмс])/g;
  let match;
  let time = 0;

  while ((match = regex.exec(timeString)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'w':
      case 'н':
        time += value * 604800000; // 1 неделя в миллисекундах
        break;
      case 'd':
      case 'д':
        time += value * 86400000; // 1 день в миллисекундах
        break;
      case 'h':
      case 'ч':
        time += value * 3600000; // 1 час в миллисекундах
        break;
      case 'm':
      case 'м':
        time += value * 60000; // 1 минута в миллисекундах
        break;
      case 's':
      case 'с':
        time += value * 1000; // 1 секунда в миллисекундах
        break;
      default:
        throw new Error('Неверный формат времени.');
    }
  }

  // Ограничение на 24 дня (в миллисекундах: 24 * 86400000 = 2073600000)
  const maxTime = 24 * 86400000; // 24 дня в миллисекундах
  if (time > maxTime) {
    throw new Error('Время не должно превышать 24 дня.');
  }

  return time;
}

// Функция для форматирования времени
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  return `${weeks ? weeks + ' неделя(-и) ' : ''}${days % 7 ? days % 7 + ' день(-дней) ' : ''}${hours % 24 ? hours % 24 + ' час(-ов) ' : ''}${minutes % 60 ? minutes % 60 + ' минут(-а) ' : ''}${seconds % 60 ? seconds % 60 + ' секунд(-а)' : ''}`;
}
