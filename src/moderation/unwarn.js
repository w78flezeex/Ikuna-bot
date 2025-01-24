const { SlashCommandBuilder } = require('@discordjs/builders');
const { warns } = require('../../mongoDB'); // Импортируем модель warns из файла models.js
const { EmbedBuilder } = require('discord.js');
const { modembed } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Удалить предупреждение участника')
    .addUserOption(option =>
      option.setName('участник')
        .setDescription('Участник, у которого нужно удалить предупреждение')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('номер')
        .setDescription('Номер предупреждения, которое нужно удалить')
        .setRequired(true)
    ),
  async execute(interaction) {
    const member = interaction.member;
    const targetUser = interaction.options.getMember('участник');
    const warnNumber = interaction.options.getInteger('номер');

    if (!member.permissions.has('KICK_MEMBERS')) {
      return await interaction.reply('У вас нет прав на удаление предупреждений.');
    }

    if (!targetUser) {
      return await interaction.reply('Пожалуйста, укажите участника, у которого нужно удалить предупреждение.');
    }

    if (targetUser.id === member.user.id) {
      return await interaction.reply('Вы не можете снять предупреждение самому себе.');
    }

    try {
      // Находим все предупреждения участника на сервере
      const userWarns = await warns.find({ guildID: interaction.guildId, user: targetUser.id });

      if (!userWarns || userWarns.length === 0) {
        return await interaction.reply('У указанного участника нет предупреждений на сервере.');
      }

      if (warnNumber <= 0 || warnNumber > userWarns.length) {
        return await interaction.reply('Указанный номер предупреждения недопустим.');
      }

      // Удаляем предупреждение
      const removedWarn = userWarns.splice(warnNumber - 1, 1)[0];
      await warns.deleteOne({ _id: removedWarn._id });

      const embed = new EmbedBuilder()
        .setTitle('Снятие предупреждения')
        .setDescription(`С участника ${targetUser.user.tag} было снято предупреждение под номером "**${warnNumber}**"`)
        .addFields(
          {name: 'Причина варна', value: removedWarn.reason},
          { name: 'Дата выдачи варна', value: removedWarn.date},
          { name: 'Модератор, выдавший варн', value: removedWarn.moderator},
        )
        .setColor(modembed);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при удалении предупреждения:', error.message);
      await interaction.reply('Произошла ошибка при удалении предупреждения. Пожалуйста, попробуйте еще раз позже.');
    }
  },
};
