const { money } = require('../../mongoDB');
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { embedcolor } = require('../../config.json');

function convertTimeToMilliseconds(timeString) {
    const match = timeString.match(/^(\d+)([smhdw])$/);
    if (!match) return null;
    
    const [, value, unit] = match;
    let multiplier;
    switch (unit) {
        case 's':
            multiplier = 1000;
            break;
        case 'm':
            multiplier = 60 * 1000;
            break;
        case 'h':
            multiplier = 60 * 60 * 1000;
            break;
        case 'd':
            multiplier = 24 * 60 * 60 * 1000;
            break;
        case 'w':
            multiplier = 7 * 24 * 60 * 60 * 1000;
            break;
        default:
            return null;
    }
    
    return parseInt(value) * multiplier;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('earningsetup')
    .setDescription('Установить переменные для увеличения баланса в банке')
    .addStringOption(option =>
      option.setName('процент')
        .setDescription('Увеличение баланса в процентах (укажите число без %) (пример: 50 -> 50%)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('время')
        .setDescription('Промежуток времени (например: 1h, 30m, 2d)')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('пользователь')
        .setDescription('Пользователь, которому присваивается доход')
        .setRequired(true)),
  async execute(interaction) {
    const guildId = interaction.guildId;
    
    const percentage = interaction.options.getString('процент');
    const timeString = interaction.options.getString('время');
    const user = interaction.options.getUser('пользователь');

    if (isNaN(parseFloat(percentage))) {
      return interaction.reply('Проценты должны быть числом.');
    }

    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!isAdmin) {
      return interaction.reply('У вас нет разрешения на выполнение этой команды.');
    }
    
    const timeInterval = convertTimeToMilliseconds(timeString);
    if (!timeInterval) {
      return interaction.reply('Некорректно указан промежуток времени. Используйте формат, например: 1h, 30m, 2d.');
    }

    if (isNaN(parseFloat(percentage))) {
      return interaction.reply('Проценты должны быть числом.');
    }

    try {
      const userId = user.id;

      let userVariables = await money.findOne({ userID: userId, guildID: guildId });
      if (!userVariables) {
        userVariables = await money.create({ userID: userId, guildID: guildId });
      }

      if (userVariables.status !== 'on') {
        return interaction.reply('Дополнительный доход выключен.');
      }

      userVariables.percentage = percentage;
      userVariables.time = timeInterval.toString();

      await userVariables.save();

      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('Дополнительный заработок')
        .setDescription(`Увеличение баланса: на ${percentage}% каждые ${timeString}\nПользователь: ${user.tag}`);

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ошибка при установке переменных:', error);
      return interaction.reply('Произошла ошибка при установке переменных.');
    }
  },
};
