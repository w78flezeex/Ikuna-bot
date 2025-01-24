const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { money, economy_settings } = require('../../mongoDB'); 
const { embedcolor } = require('../../config.json')

const cooldowns = new Map(); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Получить ежедневный бонус'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    try {
      let userMoney = await money.findOne({ userID: userId, guildID: guildId });
      if (!userMoney) {
        userMoney = await money.create({ userID: userId, guildID: guildId });
      }

      const economySettings = await economy_settings.findOne({ guildID: guildId }) || { minDaily: 0, maxDaily: 500 }; // Получаем настройки экономики для сервера
      const currencySymbolData = await economy_settings.findOne({ guildID: interaction.guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      const now = Date.now();
      const cooldownKey = `${guildId}-${userId}`;
      const cooldownTime = cooldowns.get(cooldownKey) || 0;

      if (now < cooldownTime) {
        const remainingCooldown = cooldownTime - now;
        const hours = Math.floor(remainingCooldown / 3600000);
        const minutes = Math.floor((remainingCooldown % 3600000) / 60000);
        const seconds = Math.floor((remainingCooldown % 60000) / 1000);
        const remainingTimeMessage = `${hours} часов ${minutes} минут ${seconds} секунд`;
        await interaction.reply(`Вы уже получили ежедневный бонус. Попробуйте снова через ${remainingTimeMessage}.`);
        return;
      }

      const minDaily = economySettings.minDaily || 0; // Минимальный заработок из настроек экономики
      const maxDaily = economySettings.maxDaily || 100; // Максимальный заработок из настроек экономики
      const daily = Math.floor(Math.random() * (maxDaily - minDaily + 1)) + minDaily; // Генерация случайного заработка в диапазоне от minEarnings до maxEarnings
      userMoney.handBalance += daily; 
      await userMoney.save(); 

      cooldowns.set(cooldownKey, now + 86400000); 

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('🎁 **Ежедневный бонус**')
        .setDescription(`Вы получили ежедневный бонус в размере ${daily} ${currencySymbol}`)
        .addFields({ name: 'Ваш текущий баланс:', value: `${userMoney.handBalance} ${currencySymbol}` })
        .setThumbnail(interaction.user.displayAvatarURL({ format: 'png' }))
        .setFooter({ text: 'Спасибо за вашу активность!', iconURL: interaction.user.displayAvatarURL({ format: 'png' }) })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при выполнении ежедневного бонуса:', error);
      await interaction.reply('Произошла ошибка при выполнении ежедневного бонуса.');
    }
  },
};
