const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { money, rank, economy_settings } = require('../../mongoDB'); // Добавляем модель levels для уровней
const { embedcolor } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Отображение таблицы лидеров по монетам или уровням')
        .addStringOption(option =>
            option.setName('тип')
                .setDescription('Выберите тип таблицы: по монетам или уровням')
                .setRequired(true)
                .addChoices(
                    { name: 'Монеты', value: 'coins' },
                    { name: 'Уровни', value: 'levels' }
                )
        ),

    async execute(interaction) {
        const guild = interaction.guild;
        const serverAvatarURL = guild.iconURL({ dynamic: true }) || '';
        const choice = interaction.options.getString('тип');

        // Получение всех участников сервера (без ботов)
        const members = await guild.members.fetch();
        const humanMembers = members.filter(member => !member.user.bot);

        if (choice === 'coins') {
            // Получение данных о балансе для всех участников
            const moneyData = await money.find({ guildID: guild.id, userID: { $in: humanMembers.map(m => m.user.id) } });

            // Создаем объект для всех участников и добавляем баланс 0 тем, кто отсутствует в базе данных
            const fullMoneyData = humanMembers.map(member => {
                const userData = moneyData.find(m => m.userID === member.id);
                return {
                    userID: member.id,
                    username: member.user.username,
                    handBalance: userData ? userData.handBalance : 0 // Если данных нет, баланс = 0
                };
            });

            // Сортировка по количеству монет
            fullMoneyData.sort((a, b) => b.handBalance - a.handBalance);

            if (fullMoneyData.length === 0) {
                return interaction.reply({ content: 'Таблица с лидерами по количеству монет не найдена.', ephemeral: true });
            }

            const currencySymbolData = await economy_settings.findOne({ guildID: guild.id });
            const currencySymbol = currencySymbolData ? currencySymbolData.currencySymbol || '💵' : '💵';

            const itemsPerPage = 15;
            const totalPages = Math.ceil(fullMoneyData.length / itemsPerPage);
            let currentPage = 0;

            const generateEmbed = (page) => {
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;
                const leaderboard = fullMoneyData.slice(start, end).map((m, i) => {
                    const rankIndex = start + i + 1;

                    let placeIcon = '';
                    if (rankIndex === 1) placeIcon = '💰';
                    else if (rankIndex === 2) placeIcon = '🥈';
                    else if (rankIndex === 3) placeIcon = '🥉';

                    return `${placeIcon} #${rankIndex} **${m.username}**\nБаланс: ${m.handBalance} ${currencySymbol}`;
                }).join('\n\n'); // Отделение каждого участника пустой строкой для удобства чтения

                const embed = new EmbedBuilder()
                    .setTitle(`Таблица лидеров по количеству монет на сервере ${guild.name}`)
                    .setThumbnail(serverAvatarURL)
                    .setDescription(leaderboard || 'Нет данных для отображения.')
                    .setFooter({ text: `Страница ${page + 1} из ${totalPages} - участников на сервере: ${humanMembers.size}` })
                    .setColor(embedcolor);

                return embed;
            };

            const generateButtons = (page) => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('first')
                            .setEmoji('⏮️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setEmoji('⬅️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setEmoji('➡️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1),
                        new ButtonBuilder()
                            .setCustomId('last')
                            .setEmoji('⏭️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1)
                    );
            };

            const embedMessage = await interaction.reply({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)], fetchReply: true });

            const collector = embedMessage.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'first') {
                    currentPage = 0;
                } else if (i.customId === 'previous') {
                    currentPage = Math.max(currentPage - 1, 0);
                } else if (i.customId === 'next') {
                    currentPage = Math.min(currentPage + 1, totalPages - 1);
                } else if (i.customId === 'last') {
                    currentPage = totalPages - 1;
                }

                await i.update({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });
            });

            collector.on('end', () => {
                embedMessage.edit({ components: [] });
            });
        } else if (choice === 'levels') {
            // Получение данных об уровнях для всех участников
            const levelData = await rank.find({ guildId: guild.id, userId: { $in: humanMembers.map(m => m.user.id) } });

            // Создаем объект для всех участников и добавляем уровень 0 тем, кто отсутствует в базе данных
            const fullLevelData = humanMembers.map(member => {
                const userData = levelData.find(m => m.userId === member.id);
                return {
                    userID: member.id,
                    username: member.user.username,
                    level: userData ? userData.level : 0 // Если данных нет, уровень = 0
                };
            });

            // Сортировка по уровню
            fullLevelData.sort((a, b) => b.level - a.level);

            if (fullLevelData.length === 0) {
                return interaction.reply({ content: 'Таблица с лидерами по уровням не найдена.', ephemeral: true });
            }

            const itemsPerPage = 15;
            const totalPages = Math.ceil(fullLevelData.length / itemsPerPage);
            let currentPage = 0;

            const generateEmbed = (page) => {
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;
                const leaderboard = fullLevelData.slice(start, end).map((m, i) => {
                    const rankIndex = start + i + 1;

                    let placeIcon = '';
                    if (rankIndex === 1) placeIcon = '🏆';
                    else if (rankIndex === 2) placeIcon = '🥈';
                    else if (rankIndex === 3) placeIcon = '🥉';

                    return `${placeIcon} #${rankIndex} **${m.username}**\nУровень: ${m.level}`;
                }).join('\n\n'); // Отделение каждого участника пустой строкой для удобства чтения

                const embed = new EmbedBuilder()
                    .setTitle(`Таблица лидеров по уровням на сервере ${guild.name}`)
                    .setThumbnail(serverAvatarURL)
                    .setDescription(leaderboard || 'Нет данных для отображения.')
                    .setFooter({ text: `Страница ${page + 1} из ${totalPages} - участников на сервере: ${humanMembers.size}` })
                    .setColor(embedcolor);

                return embed;
            };

            const generateButtons = (page) => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('first')
                            .setEmoji('⏮️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setEmoji('⬅️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setEmoji('➡️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1),
                        new ButtonBuilder()
                            .setCustomId('last')
                            .setEmoji('⏭️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1)
                    );
            };

            const embedMessage = await interaction.reply({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)], fetchReply: true });

            const collector = embedMessage.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'first') {
                    currentPage = 0;
                } else if (i.customId === 'previous') {
                    currentPage = Math.max(currentPage - 1, 0);
                } else if (i.customId === 'next') {
                    currentPage = Math.min(currentPage + 1, totalPages - 1);
                } else if (i.customId === 'last') {
                    currentPage = totalPages - 1;
                }

                await i.update({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });
            });

            collector.on('end', () => {
                embedMessage.edit({ components: [] });
            });
        }
    }
};
