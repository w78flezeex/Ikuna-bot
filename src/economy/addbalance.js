const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { money, economy_settings } = require('../../mongoDB');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addbalance')
    .setDescription('Добавить деньги на баланс пользователя')
    .addUserOption(option =>
      option.setName('пользователь')
        .setDescription('Пользователь, которому нужно добавить деньги')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('сумма')
        .setDescription('Сумма, которую нужно добавить')
        .setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply('Эта команда доступна только администраторам.');
    }

    const targetUser = interaction.options.getUser('пользователь');
    const amount = interaction.options.getInteger('сумма');

    if (amount <= 0) {
      return interaction.reply('Сумма должна быть положительной.');
    }

    try {
      let userMoney = await money.findOne({ userID: targetUser.id, guildID: interaction.guildId });

      if (!userMoney) {
        userMoney = new money({
          handBalance: 0,
          bankBalance: 0,
          userID: targetUser.id,
          guildID: interaction.guildId,
          status: '',
          percentage: '',
        });
      }

      userMoney.handBalance += amount;
      await userMoney.save();

      const currencySymbolData = await economy_settings.findOne({ guildID: interaction.guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('💰 **Добавление баланса**')
        .setDescription(`Добавлено ${amount} ${currencySymbol} на баланс пользователя ${targetUser.username}.`)
        .addFields({ name: 'Новый баланс:', value: `${userMoney.handBalance} ${currencySymbol}` })
        .setThumbnail(targetUser.displayAvatarURL({ format: 'png' }))
        .setFooter({ text: `Баланс обновлен администратором.`, iconURL: interaction.user.displayAvatarURL({ format: 'png' }) })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при добавлении баланса:', error);
      await interaction.reply('Произошла ошибка при добавлении баланса.');
    }
  },
};
