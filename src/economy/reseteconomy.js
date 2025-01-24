const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { money, economy_settings, shop } = require('../../mongoDB');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reseteconomy')
    .setDescription('Сбросить экономику сервера'),
  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply('Эта команда доступна только администраторам.');
    }

    try {
      // Сброс всех значений экономики на сервере
      await money.updateMany({ guildID: interaction.guildId }, { handBalance: 0, bankBalance: 0, status: null, percentage: null });
      await economy_settings.updateOne({ guildID: interaction.guildId }, { currencySymbol: null, maxMonthly: 0, minMonthly: 0, maxBonus: 0, minBonus: 0, maxEarnings: 0, minEarnings: 0 }); // Обновите эту строку в соответствии с вашей структурой базы данных
      await shop.updateOne({ guildID: interaction.guildId }, { quantity: null, price: null, description: null, title: null, items: null });

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('💰 **Сброс экономики**')
        .setDescription('Вся экономика на этом сервере была успешно сброшена.')
        .setFooter({ text: 'Сброс выполнен администратором.', iconURL: interaction.user.displayAvatarURL({ format: 'png' }) })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при сбросе экономики:', error);
      await interaction.reply('Произошла ошибка при сбросе экономики.');
    }
  },
};
