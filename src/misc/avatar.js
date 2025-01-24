const { EmbedBuilder } = require('discord.js');
const { embedcolor } = require('../../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Показать аватар участника')
    .addUserOption(option =>
      option.setName('участник')
        .setDescription('Посмотреть аватарку участника')),

  async execute(interaction) {
    // Получаем участника из опций (если не указан, используем автора команды)
    const user = interaction.options.getUser('участник') || interaction.user;

    // Создаем встроенное сообщение (MessageEmbed) для отображения аватара участника
    const embed = new EmbedBuilder()
      .setColor(embedcolor)
      .setTitle(`Аватарка участника ${user.username}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }));

    // Отправляем встроенное сообщение с аватаром участника
    await interaction.reply({ embeds: [embed] });
  },
};
