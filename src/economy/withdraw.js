const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { money, economy_settings } = require('../../mongoDB');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Снять деньги с банка')
    .addIntegerOption(option =>
      option.setName('сумма')
        .setDescription('Сумма, которую вы хотите снять с банка')
        .setRequired(true)),
  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    const withdrawAmount = interaction.options.getInteger('сумма');

    if (withdrawAmount <= 0) {
      return interaction.reply('Сумма должна быть положительной.');
    }

    try {
      let userMoney = await money.findOne({ userID: userId, guildID: guildId });
      if (!userMoney) {
        return interaction.reply('У вас нет денег в банке.');
      }

      if (userMoney.bankBalance < withdrawAmount) {
        return interaction.reply('У вас недостаточно денег в банке для этой операции.');
      }

      userMoney.handBalance += withdrawAmount;
      userMoney.bankBalance -= withdrawAmount;

      await userMoney.save();

      const currencySymbolData = await economy_settings.findOne({ guildID: interaction.guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('💰 **Снятие**')
        .setDescription(`Вы сняли ${withdrawAmount} ${currencySymbol} с банка.`)
        .addFields(
          { name: 'На руках:', value: `${userMoney.handBalance >= 0 ? userMoney.handBalance : 0} ${currencySymbol}` },
          { name: 'В банке:', value: `${userMoney.bankBalance} ${currencySymbol}` }
        )
        .setThumbnail(interaction.user.displayAvatarURL({ format: 'png' }))
        .setFooter({ text: 'Обновленный баланс.', iconURL: interaction.user.displayAvatarURL({ format: 'png' }) })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при выполнении снятия:', error);
      await interaction.reply('Произошла ошибка при выполнении снятия.');
    }
  },
};
