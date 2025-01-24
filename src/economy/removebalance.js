const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { money, economy_settings } = require('../../mongoDB');
const { embedcolor } = require('../../config.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removebalance')
    .setDescription('Снять деньги с баланса пользователя')
    .addUserOption(option =>
      option.setName('пользователь')
        .setDescription('Пользователь, у которого нужно снять деньги')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('сумма')
        .setDescription('Сумма, которую нужно снять')
        .setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply('Эта команда доступна только администраторам.');
    }

    const targetUser = interaction.options.getUser('пользователь');
    const amount = interaction.options.getInteger('сумма');

    if (amount <= 0) {
      return interaction.reply('Сумма должна быть положительной.');
    }

    try {
      // Проверяем наличие пользователя в базе данных
      let userMoney = await money.findOne({ userID: targetUser.id, guildID: interaction.guildId });

      // Если пользователь не найден, создаем запись
      if (!userMoney) {
        userMoney = new money({
          handBalance: 0, // Начальное значение баланса
          bankBalance: 0, // Можно добавить начальное значение баланса на банковском счете, если нужно
          userID: targetUser.id,
          guildID: interaction.guildId,
          status: '', // Можно добавить другие поля, если нужно
          percentage: '', // Например, статус, проценты и т.д.
        });
      }

      // Проверяем, достаточно ли у пользователя средств для снятия
      if (userMoney.handBalance < amount) {
        return interaction.reply('У пользователя недостаточно средств на руках.');
      }

      // Снимаем сумму с баланса пользователя
      userMoney.handBalance -= amount;

      // Сохраняем обновленные данные о балансе пользователя
      await userMoney.save();

      const currencySymbolData = await economy_settings.findOne({ guildID: interaction.guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('💰 **Снятие баланса**')
        .setDescription(`Снято ${amount} ${currencySymbol} с рук пользователя ${targetUser.username}.`)
        .addFields([{ name: 'Новый баланс:', value: `${userMoney.handBalance} ${currencySymbol}` }])
        .setThumbnail(targetUser.displayAvatarURL({ format: 'png' }))
        .setFooter({ text: 'Баланс обновлен администратором.', iconURL: interaction.user.displayAvatarURL({ format: 'png' }) })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при снятии баланса:', error);
      await interaction.reply('Произошла ошибка при снятии баланса.');
    }
  },
};
