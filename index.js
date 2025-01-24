const { Client, GatewayIntentBits, ActivityType, Collection, ButtonStyle } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require("@distube/yt-dlp");
const { mongoDB, clientIdentificator, token, embedcolor } = require("./config.json")

// Подключение к базе данных MongoDB
mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Соединился с MongoDB');
}).catch(err => {
    console.error('Нет соединение с MongoDB:', err);
});

// Включение интентов
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates, // Важный интент для работы с голосовыми каналами
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageTyping,
    ],
});

// Инициализация DisTube с плагином yt-dlp
client.distube = new DisTube(client, {
    plugins: [
        new YtDlpPlugin({ update: false })
    ],
    emitNewSongOnly: true,
    joinNewVoiceChannel: false,
    nsfw: true,
});

client.distube.on("initQueue", queue => {
    queue.autoplay = false;            // Отключаем автоплей
    queue.leaveOnEmpty = true;         // Включаем автоматический выход из пустого канала
    queue.emptyCooldown = 20;          // 20 секунд ожидания перед выходом
});

const { GiveawaysManager } = require('vante-giveaways');
const { giveaways } = require("./mongoDB");
class GiveawayManagerWithMongo extends GiveawaysManager {
    // This function is called when the manager needs to get all giveaways which are stored in the database.
    async getAllGiveaways() {
        // Get all giveaways from the database. We fetch all documents by passing an empty condition.
        return await giveaways.find().lean().exec();
    }

    // This function is called when a giveaway needs to be saved in the database.
    async saveGiveaway(messageId, giveawayData) {
        // Add the new giveaway to the database
        await giveaways.create(giveawayData);
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be edited in the database.
    async editGiveaway(messageId, giveawayData) {
        // Find by messageId and update it
        await giveaways.updateOne({ messageId }, giveawayData).exec();
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be deleted from the database.
    async deleteGiveaway(messageId) {
        // Find by messageId and delete it
        await giveaways.deleteOne({ messageId }).exec();
        // Don't forget to return something!
        return true;
    }
};

// Создание экземпляра менеджера розыгрышей
const manager = new GiveawayManagerWithMongo(client, {
    // Не указывайте 'storage', так как используете собственную базу данных
    updateCountdownEvery: 10000, // Обновление таймера каждые 10 секунд
    default: {
        botsCanWin: false,
        embedColor: embedcolor,
        embedColorEnd: '#FF0000',
        buttonEmoji: '🎉',
        buttonStyle: ButtonStyle.Primary,
        replyToGiveaway: true,
    }
});

client.giveawaysManager = manager;

client.giveawaysManager.on('giveawayJoined', (giveaway, member, interaction) => {
    if (!giveaway.isDrop) return interaction.reply({ content: `:tada: **${member.user.username}**, поздравляем! Теперь ты участвуешь!`, ephemeral: true })

    interaction.reply({ content: `:tada: **${member.user.username}**, поздравляем! Теперь ты участник дропа!`, ephemeral: true })
});

client.giveawaysManager.on('giveawayLeaved', (giveaway, member, interaction) => {
    return interaction.reply({ content: `**${member.user.username}**, вы покинули розыгрыш`, ephemeral: true })
});

client.commands = new Map();

const commandFolders = fs.readdirSync('./src/');

for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./src/${folder}`).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./src/${folder}/${file}`);
        client.commands.set(command.data.name, command);
    }
}

const commands = Array.from(client.commands.values()).map(command => command.data.toJSON());

const handlersDir = path.join(__dirname, 'handlers');

// Читаем все файлы из папки handlers
fs.readdir(handlersDir, (err, files) => {
    if (err) {
        console.error('Ошибка при чтении директории handlers:', err);
        return;
    }

    // Фильтруем только файлы JavaScript
    const jsFiles = files.filter((file) => file.endsWith('.js'));

    // Загружаем каждый файл handler
    for (const file of jsFiles) {
        const handler = require(path.join(handlersDir, file));
        if (handler.init) {
            handler.init(client);
            console.log(`Handler ${file} загружен.`);
        } else {
            console.warn(`Handler ${file} не имеет метода init.`);
        }
    }

    const clientId = clientIdentificator; // Замените на ваш ID клиента бота

    // Создание REST клиента
    const rest = new REST({ version: '10' }).setToken(token);

    // Загрузка ивентов из папки ./events
    client.on('ready', async () => {
        console.log(`Зарегистрирован бот ${client.user.tag}`);

        // Установка пользовательских статусов
        const statuses = [
            { name: 'бета-тест | /help', type: ActivityType.Playing },
            { name: 'cпасибо, что добавили меня 💖', type: ActivityType.Watching },
            { name: 'это только начало!', type: ActivityType.Watching }
        ];
        let currentStatus = 0;
        setInterval(() => {
            currentStatus = (currentStatus + 1) % statuses.length;
            client.user.setActivity(statuses[currentStatus]);
        }, 30000); // Смена статуса каждые 10 секунд

        try {
            // Получаем список серверов, на которых находится бот
            const guilds = client.guilds.cache.map(guild => guild.id);

            for (const guildId of guilds) {
                // Обновляем команды на каждом сервере
                await rest.put(
                    Routes.applicationGuildCommands(clientIdentificator, guildId),
                    { body: commands },
                );
                console.log(`Приложение Successfall перезагрузило (/) командует ему ${guildId}.`);
            }
        } catch (error) {
            console.error(error);
        }
    });

    client.on('guildCreate', async guild => {
        try {
            // Обновляем команды на сервере
            await rest.put(
                Routes.applicationGuildCommands(clientId, guild.id),
                { body: commands },
            );

            console.log(`Я создала slash команды на сервере ${guild.id}.`);
            console.log(`Отправила приветственное сообщение на сервер ${guild.name}.`);
        } catch (error) {
            console.error('Ошибка при отправке приветственного сообщения:', error.message);
        }
    });

    process.on('unhandledRejection', error => {
        console.error('Отказ от необработанного обещанияn:', error);
    });

    process.on('uncaughtException', error => {
        console.error('Неперехваченное исключение:', error);
        // В случае критической ошибки можно выполнить действия по перезапуску, если необходимо
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;

        if (!client.commands.has(commandName)) return;

        try {
            // Обработка команды
            await client.commands.get(commandName).execute(interaction, client.distube);
        } catch (error) {
            console.error(`Ошибка при выполнении команды ${commandName}:`, error);

            // Обработка ошибок DisTube
            if (error.message.includes('DisTube')) {
                try {
                    await interaction.reply({
                        content: 'Ошибка! Возможно, боту не хватает прав для выполнения музыкальной команды.',
                        ephemeral: true,
                    });
                } catch (replyError) {
                    console.error('Ошибка при попытке отправить сообщение об ошибке DisTube:', replyError);
                }
            }
            // Обработка ошибок, связанных с отсутствием прав
            else if (error.message.includes('MissingPermissions')) {
                try {
                    await interaction.reply({
                        content: 'У вас нет прав для выполнения этой команды.',
                        ephemeral: true,
                    });
                } catch (replyError) {
                    console.error('Ошибка при попытке отправить сообщение об ошибке прав:', replyError);
                }
            }
            // Обработка других ошибок
            else {
                try {
                    await interaction.reply({
                        content: 'Произошла ошибка. Если ошибка не пропадает, свяжитесь с владельцем.',
                        ephemeral: true,
                    });
                } catch (replyError) {
                    console.error('Ошибка при попытке отправить сообщение об общей ошибке:', replyError);
                }
            }
        }
    });

    // Загрузка ивентов из папки events
    const loadEvents = (client) => {
        const eventsPath = path.join(__dirname, 'events');

        // Рекурсивно читаем все файлы из папки events и её подпапок
        const loadFilesRecursively = (dir) => {
            fs.readdirSync(dir).forEach(file => {
                const filePath = path.join(dir, file);
                if (fs.statSync(filePath).isDirectory()) {
                    loadFilesRecursively(filePath); // Если это папка, идем внутрь рекурсивно
                } else if (file.endsWith('.js')) {
                    const event = require(filePath);
                    if (typeof event === 'function') {
                        event(client);  // Если это функция, вызываем её с передачей client
                    }
                }
            });
        };

        // Загружаем все файлы из папки events
        loadFilesRecursively(eventsPath);
    };
    loadEvents(client);

    // Аутентификация бота
    client.login(token);
});