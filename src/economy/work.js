const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { money, economy_settings } = require('../../mongoDB');
const { embedcolor } = require('../../config.json');

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Выполнить работу и заработать монеты'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    try {
      let userMoney = await money.findOne({ userID: userId, guildID: guildId });
      if (!userMoney) {
        userMoney = await money.create({ userID: userId, guildID: guildId });
      }

      const economySettings = await economy_settings.findOne({ guildID: guildId }) || { minEarnings: 0, maxEarnings: 100 };
      const currencySymbolData = await economy_settings.findOne({ guildID: interaction.guildId });
      const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

      const now = Date.now();
      const cooldownKey = `${guildId}-${userId}`;
      const cooldownTime = cooldowns.get(cooldownKey) || 0;

      if (now < cooldownTime) {
        const remainingCooldown = cooldownTime - now;
        const minutes = Math.floor(remainingCooldown / 60000);
        const seconds = Math.floor((remainingCooldown % 60000) / 1000);
        const remainingTimeMessage = `${minutes} минут ${seconds} секунд`;
        await interaction.reply(`Вы уже выполнили эту команду. Попробуйте снова через ${remainingTimeMessage}.`);
        return;
      }

      const minEarnings = economySettings.minEarnings || 0;
      const maxEarnings = economySettings.maxEarnings || 100;
      const earnings = Math.floor(Math.random() * (maxEarnings - minEarnings + 1)) + minEarnings;

      userMoney.handBalance += earnings;
      await userMoney.save();

      cooldowns.set(cooldownKey, now + 600000);

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('💼 **Работа**')
        .setDescription(`Вы выполнили работу и заработали ${earnings} ${currencySymbol}`)
        .addFields(
          { name: 'Ваш текущий баланс:', value: `${userMoney.handBalance} ${currencySymbol}` }
        )
        .setThumbnail(interaction.user.displayAvatarURL({ format: 'png' }))
        .setFooter({ text: 'Спасибо за ваш труд!', iconURL: interaction.user.displayAvatarURL({ format: 'png' }) })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при выполнении работы:', error);
      await interaction.reply('Произошла ошибка при выполнении работы.');
    }
  },
};
