const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { modembed, embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Забанить участника')
    .addUserOption(option =>
      option.setName('участник')
        .setDescription('Участник, которого нужно забанить')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('причина')
        .setDescription('Причина бана (не обязательно)')
        .setRequired(false)
    ),
  async execute(interaction) {
    const userToBan = interaction.options.getMember('участник');
    const reason = interaction.options.getString('причина') || 'не указана';

    if (!userToBan) {
      return interaction.reply('Участник не найден.');
    }

    // Проверка разрешения на бан участников
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply('У вас нет прав на бан участников.');
    }

    // Проверка роли Администратора у участника
    if (userToBan.roles.cache.some(role => role.name === 'Администратор')) {
      return interaction.reply('Вы не можете забанить администратора.');
    }

    // Проверка на наличие прав Банить и Выгонять участников у участника
    if (
      userToBan.permissions.has(PermissionsBitField.Flags.BanMembers) ||
      userToBan.permissions.has(PermissionsBitField.Flags.KickMembers) ||
      userToBan.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return interaction.reply('Вы не можете забанить данного участника.');
    }

    // Получаем URL серверного аватара (thumbnail)
    const serverThumbnailURL = interaction.guild.iconURL({ format: 'png' });

    try {
      // Пытаемся отправить сообщение пользователю
      try {
        await userToBan.send({
          embeds: [
            new EmbedBuilder()
              .setColor(modembed) // Красный цвет
              .setTitle('Бан')
              .setDescription(`Вы были забанены на сервере ${interaction.guild.name}`)
              .addFields(
                { name: 'Причина', value: reason },
                { name: 'Модератор', value: interaction.user.tag }
              )
              .setThumbnail(serverThumbnailURL || `https://cdn.discordapp.com/avatars/1200794422397378600/a_5190075ab6ca7d43e74805c59023138d.gif?size=4096`)
          ]
        });
      } catch (sendError) {
        console.error('Ошибка при отправке сообщения пользователю:', sendError);
        // Игнорируем ошибку отправки сообщения пользователю, но продолжаем выполнять бан
      }

      // Пытаемся забанить пользователя с указанием причины
      await interaction.guild.members.ban(userToBan, { reason });

      // Создаем embed сообщение о бане на сервере
      const banEmbed = new EmbedBuilder()
        .setColor(embedcolor) // Красный цвет
        .setTitle('Бан')
        .setDescription(`${userToBan.user.tag} был успешно забанен на сервере.`)
        .addFields(
          { name: 'Причина', value: reason },
          { name: 'Модератор', value: interaction.user.tag }
        )
        .setThumbnail(serverThumbnailURL || `https://cdn.discordapp.com/avatars/1200794422397378600/a_5190075ab6ca7d43e74805c59023138d.gif?size=4096`);

      await interaction.reply({ embeds: [banEmbed], ephemeral: false });
    } catch (error) {
      console.error('Ошибка при выполнении команды:', error);
      // Если бан не удался, отправляем сообщение об ошибке
      await interaction.reply('Произошла ошибка при выполнении команды.');
    }
  },
};
