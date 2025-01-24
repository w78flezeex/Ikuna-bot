const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { autoModeration } = require('../../mongoDB');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Настроить автомодерацию')
    .setDefaultMemberPermissions(0x0000000000000008n), // ADMINISTRATOR permission in BigInt
  async execute(interaction) {
    const isAdmin = interaction.member.permissions.has('ADMINISTRATOR');

    if (!isAdmin) {
      return interaction.reply('Настроить автомодерацию может только администратор.');
    }

    try {
      let existingData = await autoModeration.findOne({ guildID: interaction.guild.id });

      if (!existingData) {
        // Создаем новую запись, если ее нет
        existingData = await autoModeration.create({
          guildID: interaction.guild.id,
          banlinks: '.ru', // По умолчанию, чтобы было что-то в базе данных
          whitelistChannels: [],
          mentionsStatus: 'off',
          badWordsStatus: 'off',
          linksStatus: 'off',
          banwords: '',
          automodStatus: 'off',
          whitelistChannelsStatus: 'off',
          whitelistusers: 'off',
          whitelistuserslist: [] // Добавляем пустой массив по умолчанию
        });
      }

      // Создаем embed сообщение с текущими настройками
      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('Настройка автомодерации')
        .setDescription(`
          📢 Блокировка рекламы: ${existingData.linksStatus === 'on' ? 'включено' : 'выключено'}
          📢 Запрещённые домены: ${existingData.banlinks}
          😶 Блокировка запрещённых слов: ${existingData.badWordsStatus === 'on' ? 'включено' : 'выключено'}
          😶 Запрещённые слова: ${existingData.banwords}
          🔊 Упоминания (everyone, here): ${existingData.mentionsStatus === 'on' ? 'включено' : 'выключено'}
          🔒 Автомодерация: ${existingData.automodStatus === 'on' ? 'включено' : 'выключено'}
          📋 Разрешённые каналы: ${existingData.whitelistChannelsStatus === 'on' ? 'включено' : 'выключено'}
          📋 Список каналов: ${existingData.whitelistChannels.join(', ') || 'пусто'}
          👤 Белый список пользователей: ${existingData.whitelistusers === 'on' ? 'включено' : 'выключено'}
          👤 Список пользователей белого списка: ${existingData.whitelistuserslist.join(', ') || 'пусто'}
        `);

      // Создаем кнопки
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('toggle_linksStatus')
            .setLabel(existingData.linksStatus === 'on' ? 'Выключить' : 'Включить')
            .setStyle(existingData.linksStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji('📢'),
          new ButtonBuilder()
            .setCustomId('configure_links')
            .setLabel('Настроить')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📢'),
          new ButtonBuilder()
            .setCustomId('toggle_badWordsStatus')
            .setLabel(existingData.badWordsStatus === 'on' ? 'Выключить' : 'Включить')
            .setStyle(existingData.badWordsStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji('😶'),
          new ButtonBuilder()
            .setCustomId('configure_badWords')
            .setLabel('Настроить')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('😶'),
          new ButtonBuilder()
            .setCustomId('toggle_mentionsStatus')
            .setLabel(existingData.mentionsStatus === 'on' ? 'Выключить' : 'Включить')
            .setStyle(existingData.mentionsStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji('🔊')
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('toggle_automodStatus')
            .setLabel(existingData.automodStatus === 'on' ? 'Выключить' : 'Включить')
            .setStyle(existingData.automodStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji('🔒'),
          new ButtonBuilder()
            .setCustomId('toggle_whitelistChannelsStatus')
            .setLabel(existingData.whitelistChannelsStatus === 'on' ? 'Выключить' : 'Включить')
            .setStyle(existingData.whitelistChannelsStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji('📋'),
          new ButtonBuilder()
            .setCustomId('configure_whitelistChannels')
            .setLabel('Настроить')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋'),
          new ButtonBuilder()
            .setCustomId('toggle_whitelistUsers')
            .setLabel(existingData.whitelistusers === 'on' ? 'Выключить' : 'Включить')
            .setStyle(existingData.whitelistusers === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji('👤'),
          new ButtonBuilder()
            .setCustomId('configure_whitelistUsers')
            .setLabel('Настроить')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👤')
        );

      // Отправляем сообщение с embed и кнопками
      await interaction.reply({ embeds: [embed], components: [row, row2] });

      const filter = i => i.customId.startsWith('toggle') && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async i => {
        if (!i.member.permissions.has('ADMINISTRATOR')) {
          return i.reply({ content: 'Вы не имеете прав для изменения настроек.', ephemeral: true });
        }

        if (i.customId === 'toggle_linksStatus') {
          existingData.linksStatus = existingData.linksStatus === 'on' ? 'off' : 'on';
        } else if (i.customId === 'toggle_badWordsStatus') {
          existingData.badWordsStatus = existingData.badWordsStatus === 'on' ? 'off' : 'on';
        } else if (i.customId === 'toggle_mentionsStatus') {
          existingData.mentionsStatus = existingData.mentionsStatus === 'on' ? 'off' : 'on';
        } else if (i.customId === 'toggle_automodStatus') {
          existingData.automodStatus = existingData.automodStatus === 'on' ? 'off' : 'on';
        } else if (i.customId === 'toggle_whitelistChannelsStatus') {
          existingData.whitelistChannelsStatus = existingData.whitelistChannelsStatus === 'on' ? 'off' : 'on';
        } else if (i.customId === 'toggle_whitelistUsers') {
          existingData.whitelistusers = existingData.whitelistusers === 'on' ? 'off' : 'on';
        }

        await existingData.save();

        const updatedEmbed = new EmbedBuilder()
          .setColor(embedcolor)
          .setTitle('Настройка автомодерации')
          .setDescription(`
            📢 Блокировка рекламы: ${existingData.linksStatus === 'on' ? 'включено' : 'выключено'}
            📢 Запрещённые домены: ${existingData.banlinks}
            😶 Блокировка запрещённых слов: ${existingData.badWordsStatus === 'on' ? 'включено' : 'выключено'}
            😶 Запрещённые слова: ${existingData.banwords}
            🔊 Упоминания (everyone, here): ${existingData.mentionsStatus === 'on' ? 'включено' : 'выключено'}
            🔒 Автомодерация: ${existingData.automodStatus === 'on' ? 'включено' : 'выключено'}
            📋 Разрешённые каналы: ${existingData.whitelistChannelsStatus === 'on' ? 'включено' : 'выключено'}
            📋 Список каналов: ${existingData.whitelistChannels.join(', ') || 'пусто'}
            👤 Белый список пользователей: ${existingData.whitelistusers === 'on' ? 'включено' : 'выключено'}
            👤 Список пользователей: ${existingData.whitelistuserslist.join(', ') || 'пусто'}
          `);

        const updatedRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('toggle_linksStatus')
              .setLabel(existingData.linksStatus === 'on' ? 'Выключить' : 'Включить')
              .setStyle(existingData.linksStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
              .setEmoji('📢'),
            new ButtonBuilder()
              .setCustomId('configure_links')
              .setLabel('Настроить')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📢'),
            new ButtonBuilder()
              .setCustomId('toggle_badWordsStatus')
              .setLabel(existingData.badWordsStatus === 'on' ? 'Выключить' : 'Включить')
              .setStyle(existingData.badWordsStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
              .setEmoji('😶'),
            new ButtonBuilder()
              .setCustomId('configure_badWords')
              .setLabel('Настроить')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('😶'),
            new ButtonBuilder()
              .setCustomId('toggle_mentionsStatus')
              .setLabel(existingData.mentionsStatus === 'on' ? 'Выключить' : 'Включить')
              .setStyle(existingData.mentionsStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
              .setEmoji('🔊')
          );

        const updatedRow2 = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('toggle_automodStatus')
              .setLabel(existingData.automodStatus === 'on' ? 'Выключить' : 'Включить')
              .setStyle(existingData.automodStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
              .setEmoji('🔒'),
            new ButtonBuilder()
              .setCustomId('toggle_whitelistChannelsStatus')
              .setLabel(existingData.whitelistChannelsStatus === 'on' ? 'Выключить' : 'Включить')
              .setStyle(existingData.whitelistChannelsStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
              .setEmoji('📋'),
            new ButtonBuilder()
              .setCustomId('configure_whitelistChannels')
              .setLabel('Настроить')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📋'),
            new ButtonBuilder()
              .setCustomId('toggle_whitelistUsers')
              .setLabel(existingData.whitelistusers === 'on' ? 'Выключить' : 'Включить')
              .setStyle(existingData.whitelistusers === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
              .setEmoji('👤'),
            new ButtonBuilder()
              .setCustomId('configure_whitelistUsers')
              .setLabel('Настроить')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('👤')
          );

          await i.update({ embeds: [updatedEmbed], components: [updatedRow, updatedRow2] });
        });

      // Обработка настройки через выпадающие меню
      const configureFilter = i => i.customId.startsWith('configure') && i.user.id === interaction.user.id;
      const configureCollector = interaction.channel.createMessageComponentCollector({ configureFilter, time: 60000 });

      configureCollector.on('collect', async i => {
        if (!i.member.permissions.has('ADMINISTRATOR')) {
          return i.reply({ content: 'Вы не имеете прав для изменения настроек.', ephemeral: true });
        }

        if (i.customId === 'configure_links') {
          const modal = new ModalBuilder()
            .setCustomId('configure_links_modal')
            .setTitle('Настройка заблокированных доменов');

          const input = new TextInputBuilder()
            .setCustomId('banlinks')
            .setLabel('Запрещённые домены')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(existingData.banlinks)
            .setPlaceholder('Введите запрещённые домены через запятую.');

          const actionRow = new ActionRowBuilder().addComponents(input);
          modal.addComponents(actionRow);

          await i.showModal(modal);
        }

        if (i.customId === 'configure_badWords') {
          const modal = new ModalBuilder()
            .setCustomId('configure_badWords_modal')
            .setTitle('Настройка запрещённых слов');

          const input = new TextInputBuilder()
            .setCustomId('banwords')
            .setLabel('Запрещённые слова')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(existingData.banwords || '')
            .setPlaceholder('Введите запрещённые слова через запятую.');

          const actionRow = new ActionRowBuilder().addComponents(input);
          modal.addComponents(actionRow);

          await i.showModal(modal);
        }

        if (i.customId === 'configure_whitelistChannels') {
          const modal = new ModalBuilder()
            .setCustomId('configure_whitelistChannels_modal')
            .setTitle('Настройка разрешённых каналов / категорий');

          const input = new TextInputBuilder()
            .setCustomId('whitelistChannels')
            .setLabel('Разрешённые каналы / категории')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(existingData.whitelistChannels.join(', '))
            .setPlaceholder('Введите ID разрешённых каналов / категорий через запятую.');

          const actionRow = new ActionRowBuilder().addComponents(input);
          modal.addComponents(actionRow);

          await i.showModal(modal);
        }

        if (i.customId === 'configure_whitelistUsers') {
          const modal = new ModalBuilder()
            .setCustomId('configure_whitelistUsers_modal')
            .setTitle('Настройка пользователей белого списка');

          const input = new TextInputBuilder()
            .setCustomId('whitelistUsers')
            .setLabel('ID пользователей')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(existingData.whitelistuserslist.join(', '))
            .setPlaceholder('Введите ID пользователей через запятую.');

          const actionRow = new ActionRowBuilder().addComponents(input);
          modal.addComponents(actionRow);

          await i.showModal(modal);
        }
      });

      interaction.client.on('interactionCreate', async interaction => {
        if (!interaction.isModalSubmit()) return;
    
        const { customId } = interaction;
    
        try {
            if (customId === 'configure_links_modal') {
                const banlinks = interaction.fields.getTextInputValue('banlinks');
                existingData.banlinks = banlinks;
            }
    
            if (customId === 'configure_badWords_modal') {
                const banwords = interaction.fields.getTextInputValue('banwords');
                existingData.banwords = banwords;
            }
    
            if (customId === 'configure_whitelistChannels_modal') {
                const whitelistChannels = interaction.fields.getTextInputValue('whitelistChannels')
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => interaction.guild.channels.cache.has(id)); // Check channel existence
                existingData.whitelistChannels = whitelistChannels;
            }
    
            if (customId === 'configure_whitelistUsers_modal') {
                const whitelistUsers = interaction.fields.getTextInputValue('whitelistUsers')
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => interaction.guild.members.cache.has(id)); // Check user existence
                existingData.whitelistuserslist = whitelistUsers;
            }
    
            await existingData.save();
    
            // Send acknowledgment response if the interaction was a modal
            await interaction.reply({ content: 'Настройки обновлены!', ephemeral: true });
    
            // Create the updated embed
            const updatedEmbed = new EmbedBuilder()
                .setColor(embedcolor)
                .setTitle('Настройка автомодерации')
                .setDescription(`
                    📢 Блокировка рекламы: ${existingData.linksStatus === 'on' ? 'включено' : 'выключено'}
                    📢 Запрещённые домены: ${existingData.banlinks}
                    😶 Блокировка запрещённых слов: ${existingData.badWordsStatus === 'on' ? 'включено' : 'выключено'}
                    😶 Запрещённые слова: ${existingData.banwords}
                    🔊 Упоминания (everyone, here): ${existingData.mentionsStatus === 'on' ? 'включено' : 'выключено'}
                    🔒 Автомодерация: ${existingData.automodStatus === 'on' ? 'включено' : 'выключено'}
                    📋 Разрешённые каналы: ${existingData.whitelistChannelsStatus === 'on' ? 'включено' : 'выключено'}
                    📋 Список каналов: ${existingData.whitelistChannels.join(', ') || 'пусто'}
                    👤 Белый список пользователей: ${existingData.whitelistusers === 'on' ? 'включено' : 'выключено'}
                    👤 Список пользователей белого списка: ${existingData.whitelistuserslist.join(', ') || 'пусто'}
                `);
    
            // Create updated buttons
            const row1 = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('toggle_linksStatus')
                .setLabel(existingData.linksStatus === 'on' ? 'Выключить' : 'Включить')
                .setStyle(existingData.linksStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji('📢'),
              new ButtonBuilder()
                .setCustomId('configure_links')
                .setLabel('Настроить')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📢'),
              new ButtonBuilder()
                .setCustomId('toggle_badWordsStatus')
                .setLabel(existingData.badWordsStatus === 'on' ? 'Выключить' : 'Включить')
                .setStyle(existingData.badWordsStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji('😶'),
              new ButtonBuilder()
                .setCustomId('configure_badWords')
                .setLabel('Настроить')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('😶'),
              new ButtonBuilder()
                .setCustomId('toggle_mentionsStatus')
                .setLabel(existingData.mentionsStatus === 'on' ? 'Выключить' : 'Включить')
                .setStyle(existingData.mentionsStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji('🔊')
            );

            const row2 = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('toggle_automodStatus')
                .setLabel(existingData.automodStatus === 'on' ? 'Выключить' : 'Включить')
                .setStyle(existingData.automodStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji('🔒'),
              new ButtonBuilder()
                .setCustomId('toggle_whitelistChannelsStatus')
                .setLabel(existingData.whitelistChannelsStatus === 'on' ? 'Выключить' : 'Включить')
                .setStyle(existingData.whitelistChannelsStatus === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji('📋'),
              new ButtonBuilder()
                .setCustomId('configure_whitelistChannels')
                .setLabel('Настроить')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📋'),
              new ButtonBuilder()
                .setCustomId('toggle_whitelistUsers')
                .setLabel(existingData.whitelistusers === 'on' ? 'Выключить' : 'Включить')
                .setStyle(existingData.whitelistusers === 'on' ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji('👤'),
              new ButtonBuilder()
                .setCustomId('configure_whitelistUsers')
                .setLabel('Настроить')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👤')
        );

        // Send the updated embed and button row
        await interaction.channel.send({ embeds: [updatedEmbed], components: [row1, row2] });

    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Произошла ошибка при обновлении настроек.', ephemeral: true });
    }
});
} catch (error) {
console.error(error);
return interaction.reply({ content: 'Произошла ошибка при выполнении команды.', ephemeral: true });
}
}
}  