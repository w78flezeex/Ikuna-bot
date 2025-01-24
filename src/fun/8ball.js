const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { embedcolor } = require('../../config.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Задайте вопрос шару судьбы.')
    .addStringOption(option =>
      option.setName('вопрос')
        .setDescription('Ваш вопрос шару судьбы.')
        .setRequired(true)),
  async execute(interaction) {
    const responses = [
      'Бесспорно',
      'Предрешено',
      'Никаких сомнений',
      'Определённо да',
      'Можешь быть уверен в этом',
      'Мне кажется — да',
      'Вероятнее всего',
      'Хорошие перспективы',
      'Знаки говорят — да',
      'Да',
      'Пока не ясно, попробуй снова',
      'Спроси позже',
      'Лучше не рассказывать',
      'Сейчас нельзя предсказать',
      'Сконцентрируйся и спроси опять',
      'Даже не думай',
      'Мой ответ — нет',
      'По моим данным — нет',
      'Перспективы не очень хорошие',
      'Весьма сомнительно',
      'Надо подумать :thinking:',
      'Лучше спроси об этом завтра',
      'Странный вопрос...',
      'Мне кажется, тут есть подвох',
    ];

    const question = interaction.options.getString('вопрос');
    const response = responses[Math.floor(Math.random() * responses.length)];

    const embed = new EmbedBuilder()
      .setColor(embedcolor)
      .setTitle('Шар судьбы')
      .addFields(
        { name: 'Ваш вопрос', value: question},
        { name: 'Ответ', value: response}
      );

    await interaction.reply({ embeds: [embed] });
  },
};
