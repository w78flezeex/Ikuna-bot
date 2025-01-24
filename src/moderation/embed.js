const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Создать пользовательское встроенное (embed) сообщение')
    .addStringOption(option =>
      option.setName('титл')
        .setDescription('Заголовок для встроенного сообщения')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('текст')
        .setDescription('Текст для встроенного сообщения ".n" для сноса строки')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('цвет')
        .setDescription('Цвет встроенного сообщения (HEX код)')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('канал')
        .setDescription('Канал, в котором будет отправлено сообщение')
    )
    .addStringOption(option =>
      option.setName('кнопка1')
        .setDescription('Текст кнопки 1')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('ссылка1')
        .setDescription('Ссылка для кнопки 1')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('эмодзи1')
        .setDescription('Эмодзи для кнопки 1')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('кнопка2')
        .setDescription('Текст кнопки 2')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('ссылка2')
        .setDescription('Ссылка для кнопки 2')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('эмодзи2')
        .setDescription('Эмодзи для кнопки 2')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('кнопка3')
        .setDescription('Текст кнопки 3')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('ссылка3')
        .setDescription('Ссылка для кнопки 3')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('эмодзи3')
        .setDescription('Эмодзи для кнопки 3')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('кнопка4')
        .setDescription('Текст кнопки 4')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('ссылка4')
        .setDescription('Ссылка для кнопки 4')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('эмодзи4')
        .setDescription('Эмодзи для кнопки 4')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('кнопка5')
        .setDescription('Текст кнопки 5')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('ссылка5')
        .setDescription('Ссылка для кнопки 5')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('эмодзи5')
        .setDescription('Эмодзи для кнопки 5')
        .setRequired(false)
    ),
  async execute(interaction) {
    try {
      const embedTitle = interaction.options.getString('титл');
      const embedText = interaction.options.getString('текст').replace(/\.n/g, '\n');
      const embedColor = interaction.options.getString('цвет');
      const targetChannel = interaction.options.getChannel('канал') || interaction.channel;

      const member = interaction.member;
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        interaction.reply('У вас нет прав администратора для выполнения этой команды.');
        return;
      }

      // Проверка прав бота на отправку сообщений в целевой канал
      if (!targetChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
        return interaction.reply({
          content: `У бота нет прав на отправку сообщений в канал ${targetChannel.name}.`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(embedTitle)
        .setDescription(embedText)
        .setColor(embedColor);

      const buttons = [];
      for (let i = 1; i <= 5; i++) {
        const buttonText = interaction.options.getString(`кнопка${i}`);
        const buttonLink = interaction.options.getString(`ссылка${i}`);
        const buttonEmoji = interaction.options.getString(`эмодзи${i}`);

        if (buttonText && buttonLink) {
          const button = new ButtonBuilder()
            .setLabel(buttonText)
            .setStyle(ButtonStyle.Link)
            .setURL(buttonLink);

          if (buttonEmoji) {
            button.setEmoji(buttonEmoji);
          }

          buttons.push(button);
        }
      }

      if (buttons.length > 0) {
        const actionRow = new ActionRowBuilder().addComponents(buttons);
        await targetChannel.send({ embeds: [embed], components: [actionRow] });
      } else {
        await targetChannel.send({ embeds: [embed] });
      }

      await interaction.reply({ content: 'Пользовательское встроенное сообщение было отправлено в указанный канал.', ephemeral: true });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Произошла ошибка при создании пользовательского встроенного сообщения.', ephemeral: true });
    }
  },
};
