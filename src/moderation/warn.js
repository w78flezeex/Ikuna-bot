const { SlashCommandBuilder } = require('@discordjs/builders');
const { warns } = require('../../mongoDB'); // Импортируем модель Warns из файла models.js
const { EmbedBuilder } = require('discord.js');
const { embedcolor, modembed } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Выдать предупреждение участнику')
    .addUserOption(option =>
      option.setName('участник')
        .setDescription('Участник, которому нужно выдать предупреждение')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('причина')
        .setDescription('Причина выдачи предупреждения')
    ),
  async execute(interaction) {
    const member = interaction.member;
    const targetUser = interaction.options.getMember('участник');
    const reason = interaction.options.getString('причина') || 'Не указана';

    if (!member.permissions.has('KICK_MEMBERS')) {
      return await interaction.reply('У вас нет прав на выдачу предупреждений.');
    }

    if (!targetUser) {
      return await interaction.reply('Пожалуйста, укажите участника для выдачи предупреждения.');
    }

    if (targetUser.id === member.user.id) {
      return await interaction.reply('Вы не можете выдать предупреждение самому себе.');
    }

    try {
      // Создаем предупреждение для участника
      const warnID = generateWarnID(); // Генерация уникального идентификатора варна
      const currentDate = new Date().toLocaleDateString('ru-RU'); // Получаем текущую дату
      const guildID = interaction.guildId; // Получаем ID текущего сервера

      const newWarn = await warns.create({
        warnID: warnID,
        user: targetUser.id,
        reason: reason,
        moderator: member.user.tag,
        date: currentDate,
        guildID: guildID // Передаем ID текущего сервера в базу данных
      });

      // Отправляем embed сообщение на сервере
      const serverEmbed = new EmbedBuilder()
        .setTitle('Предупреждение')
        .setDescription(`Участник ${targetUser} получил предупреждение.`)
        .addFields(
          { name: 'Причина', value: reason},
          { name: 'Дата', value: currentDate},
          { name: 'Модератор', value: member.user.tag},
        )
        .setColor(modembed);

      await interaction.reply({ embeds: [serverEmbed] });

      // Отправляем embed сообщение в личные сообщения получателя
      const userEmbed = new EmbedBuilder()
        .setTitle('Предупреждение')
        .setDescription(`Вам выдали предупреждение на сервере ${interaction.guild.name}.`)
        .addFields(
          { name: 'Причина', value: reason},
          { name: 'Дата', value: currentDate},
          { name: 'Модератор', value: member.user.tag},
        )
        .setColor(embedcolor);

      await targetUser.send({ embeds: [userEmbed] });
    } catch (error) {
      console.error('Ошибка при выдаче предупреждения:', error.message);
      await interaction.reply('Произошла ошибка при выдаче предупреждения. Пожалуйста, попробуйте еще раз позже.');
    }
  },
};

// Генерация уникального идентификатора варна
function generateWarnID() {
  return Math.random().toString(36).substring(2, 10);
}
