const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { money, economy_settings } = require('../../mongoDB');
const { embedcolor } = require('../../config.json')

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('monthly')
    .setDescription('Получить ежемесячный бонус'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    try {
      let userMoney = await money.findOne({ userID: userId, guildID: guildId });
      if (!userMoney) {
        userMoney = await money.create({ userID: userId, guildID: guildId });
      }

      const economySettings = await economy_settings.findOne({ guildID: guildId }) || { minMonthly: 500, maxMonthly: 1000 }; // Получаем настройки экономики для сервера
      const currencySymbolData = await economy_settings.findOne({ guildID: interaction.guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      const now = Date.now();
      const cooldownKey = `${guildId}-${userId}`;
      const cooldownTime = cooldowns.get(cooldownKey) || 0;

      if (now < cooldownTime) {
        const remainingCooldown = cooldownTime - now;
        const days = Math.floor(remainingCooldown / 86400000);
        const hours = Math.floor((remainingCooldown % 86400000) / 3600000);
        const minutes = Math.floor((remainingCooldown % 3600000) / 60000);
        const seconds = Math.floor((remainingCooldown % 60000) / 1000);
        const remainingTimeMessage = `${days} дней ${hours} часов ${minutes} минут ${seconds} секунд`;
        await interaction.reply(`Вы уже получили ежемесячный бонус. Попробуйте снова через ${remainingTimeMessage}.`);
        return;
      }

      const minMonthly = economySettings.minMonthly || 0; // Минимальный заработок из настроек экономики
      const maxMonthly = economySettings.maxMonthly || 100; // Максимальный заработок из настроек экономики
      const monthly = Math.floor(Math.random() * (maxMonthly - minMonthly + 1)) + minMonthly; // Генерация случайного заработка в диапазоне от minEarnings до maxEarnings
      userMoney.handBalance += monthly;
      await userMoney.save();

      cooldowns.set(cooldownKey, now + 2592000000); // 30 дней в миллисекундах

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('🎁 **Ежемесячный бонус**')
        .setDescription(`Вы получили ежемесячный бонус в размере ${monthly} ${currencySymbol}`)
        .addFields([{ name: 'Ваш текущий баланс:', value: `${userMoney.handBalance} ${currencySymbol}` }])
        .setThumbnail(interaction.user.displayAvatarURL({ format: 'png' }))
        .setFooter({ text: 'Спасибо за вашу активность!', iconURL: interaction.user.displayAvatarURL({ format: 'png' }) })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при выполнении ежемесячного бонуса:', error);
      await interaction.reply('Произошла ошибка при выполнении ежемесячного бонуса.');
    }
  },
};
