const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Показать список команд.'),
  async execute(interaction) {
    const moderationCommands = [
        { name: '/ban', description: 'Забанить участника' },
        { name: '/unban', description: 'Разбанить участника' },
        { name: '/mute', description: 'Выдать мут участнику' },
        { name: '/unmute', description: 'Снять мут с участника' },
        { name: '/kick', description: 'Выгнать участника с сервера' },
        { name: '/warn', description: 'Выдать предупреждение участнику' },
        { name: '/unwarn', description: 'Снять предупреждение у участника' },
        { name: '/clear', description: 'Очистить сообщения в канале' },
    ];

    const fun = [
        { name: '/anime', description: 'Отравляет милую аниме девочку' },
        { name: '/8ball', description: 'Получить ответ на свой вопрос от магического шара' },
        { name: '/translate', description: 'Переводчик' },
    ];
      
   const economy = [
        { name: '/addbalance', description: 'Добавить денег на баланс участнику' },
        { name: '/balance', description: 'Просмотр своего или баланса участника' },
        { name: '/casino', description: 'Азартные игры' },
        { name: '/withdraw', description: 'Перевести деньги из банка на основной счёт' },
        { name: '/buy', description: 'Купить товар в магазине' },
        { name: '/deposite', description: 'Положить деньги в банк' },
        { name: '/economysetup', description: 'Настроить экономику' },
        { name: '/earningon', description: 'Включить дополнительный заработок на сервере' },
        { name: '/earningsetup', description: 'Настроить дополнительный заработок' },
        { name: '/purchases', description: 'Список покупок в магазине' },
        { name: '/shop', description: 'Магазин сервера' },
        { name: '/shopadd', description: 'Добавление товаров в магазин' },
        { name: '/shopremove', description: 'Удалить товары в магазине' },
        { name: '/work', description: 'Работа' },
        { name: '/monthly', description: 'Ежемесячный бонус' },
        { name: '/daily', description: 'Ежедневный бонус' },
        { name: '/leaderboard', description: 'Таблица лидеров по количеству монет или опыта' },
        { name: '/pay', description: 'Перевести деньги участнику' },
        { name: '/rob', description: 'Ограбить участника' },
    ];
      
    const miscCommands = [
        { name: '/ping', description: 'Отобразить задержку бота' },
        { name: '/help', description: 'Помощь по командам' },
        { name: '/avatar', description: 'Посмотреть аватарку участника' },
        { name: '/embed', description: 'Красивое написания текста' },
        { name: '/profile', description: 'Информация о профиле участника' },
        { name: '/serverinfo', description: 'Информация о сервере' },
        { name: '/invite', description: 'Добавить бота на свой сервер' },
        { name: '/infos', description: 'Информация о боте' },
    ];

    const automod = [
        { name: '/automod', description: 'Настройка автомодерации' },
    ];

    const creatorinfo = [
        { name: '/creatorinfo', description: 'Информация о создатели бота' },
    ];
      
    const games = [
        { name: '/game', description: 'Выбор игры' },
    ];

    const musicCommands = [
        { name: '/play', description: 'Включить музыку' },
        { name: '/queue', description: 'Посмотреть очередь песен' },
        { name: '/remove', description: 'Удалить песню из очереди' },
        { name: '/skip', description: 'Пропустить песню' },
        { name: '/stop', description: 'Остановить музыку и очистить очередь песен' },
        { name: '/search', description: 'Найти песню' },
        { name: '/pause', description: 'Поставить песню на паузу' },
        { name: '/resume', description: 'Возообновить песню c паузы' },
        { name: '/loop', description: 'Зацикливание песни' },
        { name: '/nowplaying', description: 'Посмотреть текущую песню' },
        { name: '/volume', description: 'Установить громкость музыки' },
    ];

    const giveaways = [
        { name: '/gcreate', description: 'Создать розыгрыш' },
        { name: '/gend', description: 'Принудительно завершить розыгрыш' },
        { name: '/greroll', description: 'Перевыбрать победителя' },
        { name: '/gdelete', description: 'Удалить активный розыгрыш' },
        { name: '/gpause', description: 'Поставить розыгрыш на паузу' },
        { name: '/gunpause', description: 'Снять розыгрыш с паузы' },
    ];
      
    const categories = [
        { name: '🛠️ Автомодерация', commands: automod },
        { name: '⚒️ Модерация', commands: moderationCommands },
        { name: '🎶 Музыка', commands: musicCommands },
        { name: '🤣 Веселья', commands: fun },
        { name: '🎉 Розыгрыши', commands: giveaways },
        { name: '📈 Экономика', commands: economy },
        { name: '🎮 Игры', commands: games },
        { name: '⚙️ Прочее', commands: miscCommands },
        { name: '🆘 Создатель бота', commands: creatorinfo },
    ];

    const helpEmbed = new EmbedBuilder()
      .setColor(embedcolor)
      .setTitle('Список команд Ikuna')
      .setDescription('Выберите категорию команд из выпадающего меню ниже.')

    const menuOptions = categories.map((category, index) => ({
      label: category.name,
      description: `Команды категории ${category.name.toLowerCase()}`,
      value: `${index}`,
    }));

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('helpMenu')
        .setPlaceholder('Выберите категорию')
        .addOptions(menuOptions),
    );

    await interaction.reply({ embeds: [helpEmbed], components: [row] });

    const filter = (i) => i.customId === 'helpMenu' && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (i) => {
      const categoryIndex = i.values[0];
      const selectedCategory = categories[categoryIndex];

      const categoryEmbed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle(`Команды категории: ${selectedCategory.name}`)
        .setDescription(selectedCategory.commands.map((cmd) => `**${cmd.name}**: ${cmd.description}`).join('\n'));

      await i.update({ embeds: [categoryEmbed], components: [row] });
    });

    collector.on('end', async () => {
      row.components[0].setDisabled(true);
      await interaction.editReply({ components: [row] });
    });
  },
};
