const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { economy_settings } = require('../../mongoDB');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economysetup')
    .setDescription('Настройка параметров экономики')
    .addIntegerOption(option =>
      option.setName('мин_заработок')
        .setDescription('Минимальный заработок /work')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('макс_заработок')
        .setDescription('Максимальный заработок /work')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('символ')
        .setDescription('Символ валюты')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('мин_бонус')
        .setDescription('Минимальный ежедневный бонус')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('макс_бонус')
        .setDescription('Максимальный ежедневный бонус')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('мин_месяц')
        .setDescription('Минимальный ежемесячный заработок')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('макс_месяц')
        .setDescription('Максимальный ежемесячный заработок')
        .setRequired(false)
    ),
  async execute(interaction) {
    const minEarnings = interaction.options.getInteger('мин_заработок');
    const maxEarnings = interaction.options.getInteger('макс_заработок');
    const currencySymbol = interaction.options.getString('символ');
    const minBonus = interaction.options.getInteger('мин_бонус');
    const maxBonus = interaction.options.getInteger('макс_бонус');
    const minMonthly = interaction.options.getInteger('мин_месяц');
    const maxMonthly = interaction.options.getInteger('макс_месяц');
    const guildId = interaction.guildId;

    try {
      const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
      if (!isAdmin) {
        return interaction.reply('У вас нет разрешения на выполнение этой команды.');
      }

      let settings = await economy_settings.findOne({ guildID: guildId });
      if (!settings) {
        settings = await economy_settings.create({ guildID: guildId });
      }

      // Если опции не заданы, используем уже существующие значения или задаём по умолчанию
      settings.minEarnings = minEarnings !== null ? minEarnings : settings.minEarnings || 0;
      settings.maxEarnings = maxEarnings !== null ? maxEarnings : settings.maxEarnings || 0;
      settings.currencySymbol = currencySymbol !== null ? currencySymbol : settings.currencySymbol || 'Не указан';
      settings.minBonus = minBonus !== null ? minBonus : settings.minBonus || 0;
      settings.maxBonus = maxBonus !== null ? maxBonus : settings.maxBonus || 0;
      settings.minMonthly = minMonthly !== null ? minMonthly : settings.minMonthly || 0;
      settings.maxMonthly = maxMonthly !== null ? maxMonthly : settings.maxMonthly || 0;

      await settings.save();

      const embed = new EmbedBuilder()
        .setTitle('Настройки экономики')
        .setColor(embedcolor)
        .setThumbnail('https://i.imgur.com/oj5zlIu.gif')
        .addFields(
          { name: 'Минимальный заработок', value: settings.minEarnings ? settings.minEarnings.toString() : 'Не указано' },
          { name: 'Максимальный заработок', value: settings.maxEarnings ? settings.maxEarnings.toString() : 'Не указано' },
          { name: 'Символ валюты', value: settings.currencySymbol || 'Не указан' },
          { name: 'Минимальный бонус', value: settings.minBonus ? settings.minBonus.toString() : 'Не указано' },
          { name: 'Максимальный бонус', value: settings.maxBonus ? settings.maxBonus.toString() : 'Не указано' },
          { name: 'Минимальный ежемесячный заработок', value: settings.minMonthly ? settings.minMonthly.toString() : 'Не указано' },
          { name: 'Максимальный ежемесячный заработок', value: settings.maxMonthly ? settings.maxMonthly.toString() : 'Не указано' },
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Произошла ошибка при выполнении команды economysetup:', error.message);
      await interaction.reply('Произошла ошибка при обработке вашего запроса.');
    }
  },
};
