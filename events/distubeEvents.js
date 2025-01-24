const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { embedcolor } = require('../config.json');

module.exports = (client) => {
    client.distube
        .on('error', (channel, error) => {
            console.error(`An error occurred: ${error.message}`);

            // Создаем embed сообщение для ошибки
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Произошла ошибка')
                .setDescription(`\`\`\`${error.message}\`\`\``)
                .setColor('#FF0000')
                .setTimestamp();

            // Проверяем, доступен ли канал для отправки сообщения
            if (channel && typeof channel.send === 'function') {
                channel.send({ embeds: [embed] }).catch(console.error);
            } else {
                console.error('Произошла ошибка, но нет доступного текстового канала для отправки сообщения.');
            }

            // Дополнительно: обработка конкретных ошибок
            if (error?.message?.includes('specific error string')) {
                // Обработка специфических ошибок при необходимости
            }
        })
        .on('playSong', (queue, song) => {
            const embed = new EmbedBuilder()
                .setTitle(`▶️ Сейчас играет: "${song.name}"`)
                .setDescription(`**🕔 Продолжительность:** ${song.formattedDuration}\n**🧔 Автор:** ${song.user.tag}\n**🔊 Громкость:** ${queue.volume}%`)
                .setColor(embedcolor)
                .setThumbnail(song.thumbnail || null);

            // Проверяем, доступен ли текстовый канал и отправляем сообщение
            if (queue.textChannel && typeof queue.textChannel.send === 'function') {
                queue.textChannel.send({ embeds: [embed] }).catch(console.error);
            }
        })
        .on('addSong', (queue, song) => {
            if (queue.textChannel && typeof queue.textChannel.send === 'function') {
                queue.textChannel.send(`✅ Добавила в очередь: \`${song.name}\` - \`${song.formattedDuration}\``).catch(console.error);
            }
        })
        .on('finish', (queue) => {
            if (queue.textChannel && typeof queue.textChannel.send === 'function') {
                queue.textChannel.send('🌸 Очередь песен закончилась.\nВведите команду "/play" чтобы включить музыку снова.').catch(console.error);
            }
        })
        .on('disconnect', (queue) => {
            if (queue.textChannel && typeof queue.textChannel.send === 'function') {
                queue.textChannel.send('🌸 Я отключилась от голосового канала.').catch(console.error);
            }
        })
        .on('empty', (queue) => {
            if (queue.textChannel && typeof queue.textChannel.send === 'function') {
                queue.textChannel.send('⚠️ Голосовой канал пуст. Отключаюсь...').catch(console.error);
            }
        })
        .on('initQueue', (queue) => {
            queue.volume = 100; // Устанавливаем громкость на 100%
            queue.leaveOnEmpty = true;         // Включаем автоматический выход из пустого канала
            queue.emptyCooldown = 20;          // 20 секунд ожидания перед выходом
        });
};
