const { autoModeration } = require('../mongoDB');

module.exports = {
  init: (client) => {
    client.on('messageCreate', async (message) => {
      try {
        // Игнорируем сообщения самого бота
        if (message.author.id === client.user.id) return;

        if (!message.inGuild() || !message.content) return;

        // Получаем настройки автомодерации из базы
        const autoModSettings = await autoModeration.findOne({ guildID: message.guildId }).catch(() => null);
        if (!autoModSettings) return;

        // Проверяем, включена ли автомодерация
        if (autoModSettings.automodStatus !== 'on') return;

        // Проверяем, включен ли белый список пользователей и находится ли отправитель в этом списке
        if (autoModSettings.whitelistusers === 'on' && autoModSettings.whitelistuserslist.includes(message.author.id)) return;

        // Получаем ID категории канала
        const channelCategoryId = message.channel.parentId;

        // Проверяем, находится ли канал или его категория в белом списке
        const isChannelWhitelisted = autoModSettings.whitelistChannels.includes(message.channelId);
        const isCategoryWhitelisted = channelCategoryId && autoModSettings.whitelistChannels.includes(channelCategoryId);

        // Проверяем, включена ли фильтрация рекламы
        if (autoModSettings.linksStatus === 'on' && await containsAdvertisement(message.content, autoModSettings.banlinks).catch(() => false)) {
          if ((!isChannelWhitelisted && !isCategoryWhitelisted) || autoModSettings.whitelistChannelsStatus !== 'on') {
            await message.delete().catch(() => {});
            const warningMessage = await message.channel.send(`${message.author.tag}, нельзя отправлять ссылки в чат.`).catch(() => {});
            setTimeout(async () => {
              try {
                await warningMessage.delete().catch(() => {});
              } catch {
                console.log("Моё сообщение уже удалили");
              }
            }, 3000); // Удаляем через 3 секунды
          }
        }

        // Проверяем, включена ли фильтрация плохих слов
        if (autoModSettings.badWordsStatus === 'on' && await containsBadWord(message.content, autoModSettings.banwords).catch(() => false)) {
          if ((!isChannelWhitelisted && !isCategoryWhitelisted) || autoModSettings.whitelistChannelsStatus !== 'on') {
            await message.delete().catch(() => {});
            const warningMessage = await message.channel.send(`${message.author.tag}, использование нецензурной лексики запрещено на сервере.`).catch(() => {});
            setTimeout(async () => {
              try {
                await warningMessage.delete().catch(() => {});
              } catch {
                console.log("Моё сообщение уже удалили");
              }
            }, 3000); // Удаляем через 3 секунды
          }
        }

        // Проверяем, включена ли фильтрация упоминаний @everyone и @here
        if (autoModSettings.mentionsStatus === 'on' && message.mentions.everyone) {
          if ((!isChannelWhitelisted && !isCategoryWhitelisted) || autoModSettings.whitelistChannelsStatus !== 'on') {
            await message.delete().catch(() => {});
            const warningMessage = await message.channel.send(`${message.author.tag}, упоминания запрещены на сервере.`).catch(() => {});
            setTimeout(async () => {
              try {
                await warningMessage.delete().catch(() => {});
              } catch {
                console.log("Моё сообщение уже удалили");
              }
            }, 3000); // Удаляем через 3 секунды
          }
        }
      } catch (error) {
        // Игнорируем все ошибки
      }
    });
  },
};

async function containsAdvertisement(content, banlinks) {
  // Проверка наличия рекламы в сообщении
  const linkRegex = /https?:\/\/[^\s/$.?#].[^\s]*/i;
  const defaultAds = ['.com', '.net', '.org', '.gg', '.ru'];
  const advertisements = [...defaultAds, ...banlinks.split(',').map(link => link.trim())]; // Разделяем список заблокированных доменов
  return linkRegex.test(content) || advertisements.some(ad => content.includes(ad));
}

async function containsBadWord(content, banwords) {
  // Проверка наличия плохих слов в сообщении
  const words = banwords.split(',').map(word => word.trim().toLowerCase()); // Разделяем список заблокированных слов и приводим к нижнему регистру
  const messageContent = content.toLowerCase();
  return words.some(word => messageContent.includes(word));
}
