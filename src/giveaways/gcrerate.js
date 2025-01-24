const { SlashCommandBuilder } = require('@discordjs/builders');
const { embedcolor } = require("../../config.json");
const ms = require('ms');
const { PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gcreate')
    .setDescription('Создать розыгрыш')
    .addStringOption(option => option.setName('приз').setDescription('Приз розыгрыша').setRequired(true))
    .addStringOption(option => option.setName('время').setDescription('Время розыгрыша (1д, 1ч, 1м, 1с)').setRequired(true)) // Пример: 10м, 1ч, 7д
    .addIntegerOption(option => option.setName('победители').setDescription('Количество победителей').setRequired(true))
    .addChannelOption(option => option.setName('канал').setDescription('Канал для розыгрыша').setRequired(false)), // Добавляем параметр для канала

  async execute(interaction) {
    const prize = interaction.options.getString('приз');
    let time = interaction.options.getString('время');
    const winnersCount = interaction.options.getInteger('победители');
    const channel = interaction.options.getChannel('канал') || interaction.channel; // Если канал не указан, используется текущий канал

    // Замена русских символов на английские для функции ms
    time = time
      .replace(/д/g, 'd')  // дни
      .replace(/ч/g, 'h')  // часы
      .replace(/м/g, 'm')  // минуты
      .replace(/с/g, 's'); // секунды

    // Проверка на максимальную продолжительность розыгрыша
    if (ms(time) > ms('14d')) {
      return interaction.reply({ content: 'Максимальная продолжительность розыгрыша — 14 дней!', ephemeral: true });
    }

    // Проверка на количество победителей
    if (winnersCount > 20) {
      return interaction.reply({ content: 'Максимум 20 победителей!', ephemeral: true });
    }

    // Проверка прав бота на отправку сообщений и управление сообщениями в целевом канале
    if (!channel.permissionsFor(interaction.guild.members.me).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages])) {
      return interaction.reply({ content: `У бота недостаточно прав для отправки и управления сообщениями в канале ${channel.name}.`, ephemeral: true });
    }

    // Запуск розыгрыша
    interaction.client.giveawaysManager.start(channel, {
      duration: ms(time),
      prize: prize,
      winnerCount: winnersCount,
      hostedBy: interaction.user,
      messages: {
        giveaway: '🎉🎉 **РОЗЫГРЫШ** 🎉🎉',
        giveawayEnded: '🎉🎉 **РОЗЫГРЫШ ЗАКОНЧИЛСЯ** 🎉🎉',
        giveawayEndedButton: 'Перейти к розыгрышу',
        title: '{this.prize}',
        inviteToParticipate: 'Нажмите на реакцию 🎉 чтобы участвовать!',
        winMessage: '{winners}, поздравляем! Вы выиграли **{this.prize}**!',
        drawing: 'Закончится: {timestamp-relative} ({timestamp-default})',
        dropMessage: 'Дроп! Первый, кто нажмёт на реакцию 🎉 получит приз!',
        embedFooter: 'Розыгрышь',
        noWinner: 'Розыгрыш отменён, так как нет участников.',
        winners: 'Победитель(и):',
        endedAt: 'Закончился',
        hostedBy: 'Розыгрыш запустил: {this.hostedBy}\nПобедитель(я): {this.winnerCount}',
        participants: 'Участников: {participants}',
      },
      lastChance: {
        enabled: true,
        content: '⚠️⚠️ **ДО РОЗЫГРЫША ОСТАЛОСЬ ПАРУ СЕКУНД! УСПЕЙ ПРИНЯТЬ УЧАСТИЕ!** ⚠️⚠️',
        threshold: 10_000,
        embedColor: embedcolor
      },
      pauseOptions: {
        isPaused: false,
        content: '⚠️⚠️ **РОЗЫГРЫШ НА ПАУЗЕ !** ⚠️⚠️',
        unpauseAfter: null,
        embedColor: '#FF0000',
        infiniteDurationText: '`НИКОГДА`'
      }
    });

    await interaction.reply({ content: `Розыгрыш на **${prize}** начался и продлится **${interaction.options.getString('время')}** в канале ${channel}.` });
  }
};
