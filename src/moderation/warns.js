const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { warns } = require('../../mongoDB'); // Импортируем модель warns из файла models.js
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Просмотреть предупреждения участника')
    .addUserOption(option =>
      option.setName('участник')
        .setDescription('Участник, у которого нужно просмотреть предупреждения')
        .setRequired(true)
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getMember('участник');

    if (!targetUser) {
      return await interaction.reply('Пожалуйста, укажите участника, предупреждения которого вы хотите узнать.');
    }

    try {
      // Находим все предупреждения участника на сервере
      const userWarns = await warns.find({ guildID: interaction.guildId, user: targetUser.id });

      if (!userWarns || userWarns.length === 0) {
        return await interaction.reply('У указанного участника нет предупреждений на сервере.');
      }

      const warnsList = userWarns.map((warn, index) => `**${index + 1}.** Причина: ${warn.reason} \n Модератор: ${warn.moderator} \n Дата: ${warn.date}`);

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle(`Предупреждения для ${targetUser.user.tag}`)
        .setDescription(`У участника ${targetUser.user.username} есть ${userWarns.length} предупреждений:`)
        .addFields(
          { name: 'Список предупреждений', value: warnsList.join('\n')}
        )
        .setFooter({ text: 'Просмотр предупреждений'});

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при чтении предупреждений:', error.message);
      await interaction.reply('Произошла ошибка при чтении предупреждений. Пожалуйста, попробуйте еще раз позже.');
    }
  },
};
