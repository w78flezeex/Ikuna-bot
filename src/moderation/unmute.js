const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Снять мьют с участника на сервере')
    .addUserOption(option =>
      option.setName('участник')
        .setDescription('Участник, которого нужно размьютить')
        .setRequired(true)
    ),
  async execute(interaction) {
    const member = interaction.member;
    const userToUnmute = interaction.options.getMember('участник');

    // Проверяем права пользователя
    if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply('У вас нет прав на снятие заглушки участников.');
    }

    // Проверяем, если участник не замьючен
    if (!userToUnmute.communicationDisabledUntilTimestamp || userToUnmute.communicationDisabledUntilTimestamp < Date.now()) {
      return interaction.reply('Указанный участник не замьючен.');
    }

    try {
      await userToUnmute.timeout(null); // Снимаем тайм-аут

      // Создаем embed сообщение о размуте
      const embed = new EmbedBuilder()
        .setTitle('Размьют')
        .setDescription(`${userToUnmute} был успешно размьючен.`)
        .setColor(embedcolor);

      // Создаем embed сообщение для личных сообщений участнику
      const dmEmbed = new EmbedBuilder()
        .setTitle('Размьют')
        .setDescription(`${userToUnmute}, вы были размьючены на сервере ${interaction.guild.name}.`)
        .setColor(embedcolor)
        .setThumbnail(interaction.guild.iconURL({ format: 'png' }) || `https://cdn.discordapp.com/avatars/1200794422397378600/a_5190075ab6ca7d43e74805c59023138d.gif?size=4096`);

      // Отправляем embed сообщение о размуте в личные сообщения участнику
      try {
        await userToUnmute.send({ embeds: [dmEmbed] });
      } catch (sendError) {
        console.error('Ошибка при отправке сообщения пользователю:', sendError);
        // Игнорируем ошибку отправки сообщения
      }

      // Отправляем embed сообщение о размуте в канал, где была вызвана команда
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply('Произошла ошибка при снятии заглушки участника.');
    }
  },
};
