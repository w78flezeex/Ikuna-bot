const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Разблокировать участника на сервере')
    .addStringOption(option =>
      option.setName('участник')
        .setDescription('ID пользователя, которого нужно разблокировать')
        .setRequired(true)
    ),
  async execute(interaction) {
    const member = interaction.member;
    const userToUnbanId = interaction.options.getString('участник');

    // Проверяем, имеет ли пользователь право на разбан участников
    if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply('У вас нет прав на разбан участников.');
    }

    // Получаем ID пользователя, выполнившего команду
    const userId = interaction.user.id;

    // Проверяем, пытается ли пользователь разблокировать самого себя
    if (userId === userToUnbanId) {
      return interaction.reply('Вы не можете разблокировать самого себя.');
    }

    try {
      await interaction.guild.bans.remove(userToUnbanId);
      interaction.reply(`Участник с ID ${userToUnbanId} был разблокирован.`);
    } catch (error) {
      console.error(error);
      interaction.reply('Произошла ошибка при разблокировке участника.');
    }
  },
};
