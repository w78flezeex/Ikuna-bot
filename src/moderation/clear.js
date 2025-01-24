const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Очистка сообщений в чате')
    .addIntegerOption(option =>
      option.setName('количество')
        .setDescription('Количество сообщений для очистки')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('участник')
        .setDescription('Очистить сообщения только от указанного участника')
        .setRequired(false)),
  async execute(interaction) {
    const amount = interaction.options.getInteger('количество');
    const targetUser = interaction.options.getUser('участник');
    const channel = interaction.channel;

    // Проверка прав пользователя
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply('У вас недостаточно прав для использования этой команды.');
    }

    if (amount < 1 || amount > 100) {
      return interaction.reply('Количество сообщений для очистки должно быть от 1 до 100.');
    }

    const description = targetUser 
      ? `Вы уверены, что хотите удалить последние ${amount} сообщений от ${targetUser.tag}?`
      : `Вы уверены, что хотите удалить последние ${amount} сообщений?`;

    const embed = new EmbedBuilder()
      .setColor(embedcolor)
      .setTitle('Очистка сообщений')
      .setDescription(description)
      .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const acceptButton = new ButtonBuilder()
      .setCustomId('clear_accept')
      .setLabel('Принять')
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId('clear_cancel')
      .setLabel('Отменить')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder()
      .addComponents(acceptButton, cancelButton);

    const reply = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    const filter = i => {
      return i.customId === 'clear_accept' || i.customId === 'clear_cancel';
    };

    const collector = channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: 'Вы не можете выполнить это действие.', ephemeral: true });
        return;
      }

      if (i.customId === 'clear_accept') {
        try {
          await i.update({ content: 'Подтверждено удаление сообщений.', components: [] });

          const messages = await channel.messages.fetch({ limit: amount });

          let filteredMessages = messages;
          if (targetUser) {
            // Фильтруем сообщения от конкретного участника
            filteredMessages = messages.filter(msg => msg.author.id === targetUser.id);
          }

          await channel.bulkDelete(filteredMessages);

          interaction.followUp({ content: `Удалено ${filteredMessages.size} сообщений.`, ephemeral: true });
        } catch (error) {
          console.error(error);
          await interaction.followUp('Произошла ошибка при удалении сообщений.');
        }
      } else if (i.customId === 'clear_cancel') {
        await i.update({ content: 'Операция по удалению сообщений отменена.', components: [] });
        interaction.followUp('Операция по удалению сообщений отменена.');
      }

      collector.stop();
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        reply.edit({ content: 'Прошло слишком много времени. Операция отменена.', components: [] });
      }
    });
  },
};
