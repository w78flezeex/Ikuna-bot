const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { modembed } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Выгнать участника')
    .addUserOption(option =>
      option.setName('участник')
        .setDescription('Участник, которого нужно выгнать')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('причина')
        .setDescription('Причина выгнать (не обязательно)')
        .setRequired(false)
    ),
  async execute(interaction) {
    const userToKick = interaction.options.getMember('участник');
    const reason = interaction.options.getString('причина') || 'не указана';

    if (!userToKick) {
      return interaction.reply('Участник не найден.');
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return interaction.reply('Вы не можете выгонять участников.');
    }

    if (userToKick.roles.highest.comparePositionTo(interaction.member.roles.highest) >= 0) {
      return interaction.reply('Вы не можете выгнать участника с более высокой или равной ролью.');
    }

    if (userToKick.roles.cache.some(role => role.name === 'Администратор')) {
      return interaction.reply('Вы не можете выгнать администратора.');
    }

    if (
      userToKick.permissions.has(PermissionsBitField.Flags.BanMembers) ||
      userToKick.permissions.has(PermissionsBitField.Flags.KickMembers) ||
      userToKick.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return interaction.reply('Вы не можете выгнать данного участника.');
    }

    // Запоминаем, удалось ли отправить сообщение пользователю
    let messageSent = false;

    try {
      // Пытаемся отправить сообщение пользователю
      try {
        await userToKick.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle('Кик')
              .setDescription(`Вы были кикнуты с сервера ${interaction.guild.name}`)
              .addFields(
                { name: 'Причина', value: reason },
                { name: 'Модератор', value: interaction.user.tag }
              )
          ]
        });
        messageSent = true;
      } catch (sendError) {
        console.error('Ошибка при отправке сообщения пользователю:', sendError);
        // Игнорируем ошибку отправки сообщения, но продолжаем выполнение кика
      }

      // Пытаемся выгнать пользователя
      await userToKick.kick(reason);

      // Создаем embed сообщение о кике на сервере
      const kickEmbed = new EmbedBuilder()
        .setTitle('Кик')
        .setDescription(`${userToKick.user.tag} был успешно кикнут с сервера.`)
        .addFields(
          { name: 'Причина', value: reason },
          { name: 'Модератор', value: interaction.user.tag }
        )
        .setColor(modembed);

      // Отправляем сообщение в канал
      await interaction.reply({ embeds: [kickEmbed], ephemeral: true });
    } catch (error) {
      console.error('Ошибка при выполнении команды:', error);
      // Если кик не удался и сообщение не отправлено, отправляем сообщение об ошибке
      if (!messageSent) {
        await interaction.reply('Произошла ошибка при выполнении команды. Пожалуйста, попробуйте еще раз позже.');
      } else {
        // Если сообщение было успешно отправлено, но кик не удался
        await interaction.reply('Произошла ошибка при выполнении команды, но сообщение отправлено пользователю.');
      }
    }
  },
};
